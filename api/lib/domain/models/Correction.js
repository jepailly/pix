function _byLowestSkillName(hintA, hintB) {
  return hintA.skillName > hintB.skillName;
}

class Correction {

  constructor({ id, solution, hints = [] } = {}) {
    this.id = id;
    this.solution = solution;
    this.hints = hints;
  }

  get relevantHint() {
    const hintsToSort = Array.from(this.hints);
    return hintsToSort.sort(_byLowestSkillName)[0];
  }
}

module.exports = Correction;