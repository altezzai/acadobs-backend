const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = [
      "sick", "casual", "emergency", "vacation", "onduty","c-off","other"
    ]
    res.status(200).json(leaveTypes);
  } catch (error) {
    logger.error("Error fetching leave types:", error);
    console.error("Error fetching leave types:", error);
    res.status(500).json({ error: "Failed to fetch leave types" });
  }
}
const getTermTypeForTransportationInvoice = async (req, res) => {
  try {
    const school_id = req.user.school_id;
  
    let termTypeForTransportationInvoice = [
      "Term1", "Term2", "Term3"
    ]
    res.status(200).json(termTypeForTransportationInvoice);
  } catch (error) {
    logger.error("Error fetching term type for transportation invoice:", error);
    console.error("Error fetching term type for transportation invoice:", error);
    res.status(500).json({ error: "Failed to fetch term type for transportation invoice" });
  }
}
const getClassRangeForSubject = async (req, res) => {
  try{
    const school_id = req.user.school_id;
    //set an array value and label
  let range = [
    {
    label: "LKG-2 (FS)",
    key:"FS"
    },
    {
      label:"3-5 (PS)",
      key:"PS"
    },
    {
      label:"6-8 (MS)",
      key:"MS"
    },
    {
      label:"9-12 (SS)",
      key:"SS"
    },
    {
      label:"common",
      key:"common"
    },
    {
      label:"other",
      key:"other"
    }
  ]
    res.status(200).json({range});
  }catch(error){
    logger.error("Error fetching class range for subject:", error);
    console.error("Error fetching class range for subject:", error);
    res.status(500).json({ error: "Failed to fetch class range for subject" });
  }
};
const getExamTitles = async (req, res) => {
  try{
  const titiles =[
    "PT",
    "Term",
    "Internal",
    "Model",
  ]
  res.status(200).json(titiles)
  }catch(error){
    logger.error("userId:", req.user.user_id, "Error fetching profile details:", error);
    console.error("Error fetching profile details:", error);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }

}
const getPaymentCategories =async(req,res)=>{
  try {
    const categories=[
        "tuition",
        "admission",
        "exam",
        "transport",
        "hostel",
        "lab",
        "library",
        "activity",
        "fine",
        "donation",
        "event",
        "excursion",
        "other"   
    ]
    res.status(200).json(categories);

  } catch (error) {
    logger.error("Error fetching payment categories:", error);
    console.error("Error fetching payment categories:", error);
    res.status(500).json({ error: "Failed to fetch payment categories" });
  }
}
const getGuardianRelations = async(req,res)=>{
  try {
    const relations = [
        "father",
        "mother",
        "grandfather",
        "grandmother",
        "uncle",
        "aunty",
        "local_guardian",
        "other"
    ]
    res.status(200).json(relations);
  } catch (error) {
    logger.error("Error fetching guardian relations:", error);
    console.error("Error fetching guardian relations:", error);
    res.status(500).json({ error: "Failed to fetch guardian relations" });
  }
}
module.exports={
  getLeaveTypes,
  getTermTypeForTransportationInvoice,
  getClassRangeForSubject,
  getExamTitles,
  getPaymentCategories,
  getGuardianRelations,
}
