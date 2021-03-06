const { sinon, expect } = require('../../../test-helper');

const authenticationController = require('../../../../lib/application/authentication/authentication-controller');
const usecases = require('../../../../lib/domain/usecases');
const tokenService = require('../../../../lib/domain/services/token-service');

describe('Unit | Application | Controller | Authentication', () => {

  describe('#authenticateUser', () => {

    let request;
    let stubHeader;
    let stubCode;
    let reply;

    beforeEach(() => {
      request = {
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        payload: {
          grant_type: 'password',
          username: 'user@email.com',
          password: 'user_password',
          scope: 'pix-orga'
        }
      };
      sinon.stub(usecases, 'authenticateUser').resolves('jwt.access.token');
      sinon.stub(tokenService, 'extractUserId').returns(1);
      stubHeader = sinon.stub();
      stubHeader.returns({ header: stubHeader });
      stubCode = sinon.stub().returns({ header: stubHeader });
      reply = sinon.stub().returns({ code: stubCode });
    });

    afterEach(() => {
      usecases.authenticateUser.restore();
      tokenService.extractUserId.restore();
    });

    it('should check user credentials', () => {
      // given
      const userEmail = 'user@email.com';
      const password = 'user_password';
      const scope = 'pix-orga';

      // when
      const promise = authenticationController.authenticateUser(request, reply);

      // then
      return promise.then(() => {
        expect(usecases.authenticateUser).to.have.been.calledWith({
          userEmail,
          password,
          scope,
        });
      });
    });

    /**
     * @see https://www.oauth.com/oauth2-servers/access-tokens/access-token-response/
     */
    it('should returns an OAuth 2 token response (even if we do not really implement OAuth 2 authorization protocol)', () => {
      // when
      const promise = authenticationController.authenticateUser(request, reply);

      // then
      return promise.then(() => {
        const expectedResponseResult = {
          token_type: 'bearer',
          expires_in: 3600,
          access_token: 'jwt.access.token',
          user_id: 1
        };
        expect(reply).to.have.been.calledWithExactly(expectedResponseResult);
        expect(stubCode).to.have.been.calledWith(200);
        expect(stubHeader).to.have.been.calledThrice;
        expect(stubHeader).to.have.been.calledWith('Content-Type', 'application/json;charset=UTF-8');
        expect(stubHeader).to.have.been.calledWith('Cache-Control', 'no-store');
        expect(stubHeader).to.have.been.calledWith('Pragma', 'no-cache');
      });
    });
  });

});
