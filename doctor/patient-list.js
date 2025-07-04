document.addEventListener("DOMContentLoaded", () => {
  const home = document.getElementById("home");
  const patientList = document.getElementById("patient-list");
  const viewBtn = document.getElementById("view-pat-btn");
  const backBtn = document.getElementById("back-to-home");

  viewBtn.addEventListener("click", () => {
    home.classList.remove("active");
    patientList.classList.add("active");
  });

  backBtn.addEventListener("click", () => {
    patientList.classList.remove("active");
    home.classList.add("active");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const patientList = document.getElementById("patient-list");
  const patientDetail = document.getElementById("patient-detail");
  const backToList = document.getElementById("back-to-list");
  const backToHome = document.getElementById("back-to-home");
  const patientName = document.getElementById("patient-name");
  const patientInfo = document.getElementById("patient-info");

  const patientCards = document.querySelectorAll(".patient-card");

  patientCards.forEach(card => {
    card.addEventListener("click", () => {
      const patient = card.dataset.patient;
      showSection(patientDetail, patientList);
      patientName.textContent = `病人 ${patient} 資料`;
      patientInfo.textContent = `這裡是病人 ${patient} 的詳細資料內容。`;
    });
  });

  backToList.addEventListener("click", () => {
    showSection(patientList, patientDetail);
  });

  backToHome.addEventListener("click", () => {
  showSection(document.getElementById("home"), patientList);
});

  function showSection(show, hide) {
    hide.classList.remove("active");
    show.classList.add("active");
  }
});

// 假設我們有一個病人資料物件
const patientData = {
  id: "P2025001",
  name: "陳小明",
  age: 35,
  gender: "男",
  diagnosis: "輕度語言發展遲緩，建議持續語言治療。",
  notes: "近期情緒穩定，合作良好。"
};

function showPatientDetail(data) {
  document.getElementById("patient-id").value = data.id;
  document.getElementById("patient-name-field").value = data.name;
  document.getElementById("patient-age").value = data.age;
  document.getElementById("patient-gender").value = data.gender;
  document.getElementById("patient-diagnosis").value = data.diagnosis;
  document.getElementById("patient-notes").value = data.notes;
}

