const normalizeGender = (gender) => {
  if (!gender) return null;

  const value = gender.toString().toLowerCase().trim();

  const genderMap = {
    M: "male",
    m: "male",
    male: "male",
    Male: "male",
    MALE:"male",
    F: "female",
    f: "female",
    female: "female",
    Female: "female",
    FEMALE:"female",
    o: "other",
    O: "other",
    other: "other",
    Other: "other",
    OTHER:"other",
  };

  if (!genderMap[value]) {
    throw new Error(
      `Invalid gender value "${gender}". Allowed values: m, f, o, male, female, other, M, F, O, Male, Female, Other,MALE,FEMALE,OTHER`
    );
  }

  return genderMap[value];
};
const normalizeGuardianRelation = (relation) => {
  if (!relation) return "other";

  const value = relation.toString().toLowerCase().trim();

  const relationMap = {
    // Father
    father: "father",
    f: "father",
    F: "father",
    dad: "father",
    daddy: "father",
    Father: "father",
    FATHER:"father",


    // Mother
    mother: "mother",
    m: "mother",
    M: "mother",
    mom: "mother",
    mummy: "mother",
    Mother: "mother",
    MOTHER:"mother",


    // Grandfather
    grandfather: "grandfather",
    gf: "grandfather",
    GF: "grandfather",
    grandpa: "grandfather",
    granddad: "grandfather",
    Grandpa: "grandfather",
    GRANDPA:"grandfather",


    // Grandmother
    grandmother: "grandmother",
    gm: "grandmother",
    grandma: "grandmother",
    grandmom: "grandmother",
    grandma: "grandmother",
    Grandma: "grandmother",
    GRANDMA:"grandmother",

    // Uncle
    uncle: "uncle",
    u: "uncle",
    U: "uncle",
    Uncle: "uncle",
    UNCLE:"uncle",

    // Aunty
    aunty: "aunty",
    aunt: "aunty",
    A: "aunty",
    a: "aunty",
    Aunty: "aunty",
    AUNTY:"aunty",

    // Local Guardian
    local_guardian: "local_guardian",
    localguardian: "local_guardian",
    lg: "local_guardian",
    LG: "local_guardian",
    Local_Guardian: "local_guardian",
    LOCAL_GUARDIAN:"local_guardian",

    // Other
    other: "other",
    o: "other",
    O: "other",
    Other: "other",
    OTHER:"other",
  };

  if (!relationMap[value]) {
    throw new Error(
      `Invalid guardian_relation "${relation}". Allowed values: father, mother, grandfather, grandmother, uncle, aunty, local_guardian, other`
    );
  }

  return relationMap[value];
};

module.exports = { normalizeGender , normalizeGuardianRelation};