const normalizeGender = (gender) => {
  if (!gender) return null;

  const value = gender.toString().toLowerCase().trim();

  const genderMap = {
    M: "male",
    m: "male",
    male: "male",
    Male: "male",
    F: "female",
    f: "female",
    female: "female",
    Female: "female",
    o: "other",
    O: "other",
    Other: "other",
    other: "other",
  };

  if (!genderMap[value]) {
    throw new Error(
      `Invalid gender value "${gender}". Allowed values: m, f, o, male, female, other`
    );
  }

  return genderMap[value];
};

module.exports = { normalizeGender };