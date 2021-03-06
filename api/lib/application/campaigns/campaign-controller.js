const moment = require('moment');
const usecases = require('../../domain/usecases');
const tokenService = require('../../../lib/domain/services/token-service');

const campaignSerializer = require('../../infrastructure/serializers/jsonapi/campaign-serializer');
const { UserNotAuthorizedToCreateCampaignError, UserNotAuthorizedToGetCampaignResultsError, EntityValidationError,
  NotFoundError } = require('../../domain/errors');

const JSONAPI = require('../../interfaces/jsonapi');
const logger = require('../../infrastructure/logger');
const controllerReplies = require('../../infrastructure/controller-replies');
const queryParamsUtils = require('../../infrastructure/utils/query-params-utils');
const infraErrors = require('../../infrastructure/errors');

module.exports = {

  save(request, reply) {
    const userId = request.auth.credentials.userId;

    return campaignSerializer.deserialize(request.payload)
      .then((campaign) => {
        campaign.creatorId = userId;
        return campaign;
      })
      .then((campaign) => usecases.createCampaign({ campaign }))
      .then((createdCampaign) => {
        return reply(campaignSerializer.serialize(createdCampaign)).code(201);
      })
      .catch((error) => {
        if (error instanceof UserNotAuthorizedToCreateCampaignError) {
          return reply(JSONAPI.forbiddenError(error.message)).code(403);
        }

        if (error instanceof EntityValidationError) {
          return reply(JSONAPI.unprocessableEntityError(error.invalidAttributes)).code(422);
        }

        logger.error(error);
        return reply(JSONAPI.internalError('Une erreur inattendue est survenue lors de la création de la campagne')).code(500);
      });
  },

  getByCode(request, reply) {
    const filters = queryParamsUtils.extractFilters(request);
    return _validateFilters(filters)
      .then(() => usecases.getCampaignByCode({ code: filters.code }))
      .then((campaign) => {
        return campaignSerializer.serialize([campaign]);
      })
      .then(controllerReplies(reply).ok)
      .catch((error) => {
        const mappedError = _mapToInfraError(error);
        return controllerReplies(reply).error(mappedError);
      });
  },

  getCsvResults(request, reply) {
    const token = request.query.accessToken;
    const userId = tokenService.extractUserIdForCampaignResults(token);

    const campaignId = parseInt(request.params.id);

    return usecases.getResultsCampaignInCSVFormat({ userId, campaignId })
      .then((resultCampaign) => {
        const fileName = `Resultats-${resultCampaign.campaignName}-${campaignId}-${moment().format('YYYY-MM-DD-hhmm')}.csv`;
        return reply(resultCampaign.csvData)
          .header('Content-Type', 'text/csv;charset=utf-8')
          .header('Content-Disposition', `attachment; filename="${fileName}"`);
      })
      .catch((error) => {
        if (error instanceof UserNotAuthorizedToGetCampaignResultsError) {
          return reply(JSONAPI.forbiddenError(error.message)).code(403);
        }

        logger.error(error);
        return reply(JSONAPI.internalError('Une erreur inattendue est survenue lors de la récupération des résultats de la campagne')).code(500);
      });
  },
};

function _validateFilters(filters) {
  return new Promise((resolve) => {
    if (typeof filters.code === 'undefined') {
      throw new infraErrors.MissingQueryParamError('filter.code');
    }
    resolve();
  });
}

function _mapToInfraError(error) {
  if (error instanceof NotFoundError) {
    return new infraErrors.NotFoundError(error.message);
  }

  return error;
}
