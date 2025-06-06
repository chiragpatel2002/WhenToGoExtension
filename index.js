window.addEventListener("load", () => {
  const cookies = document.cookie.split(";").map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith("token="));
  const token = tokenCookie ? tokenCookie.split("=")[1] : null;

  if (!token) {
    alert("Token not found in cookies.");
    return;
  }

  fetch("https://sitopsliveapigateway.shaligraminfotech.com/hrmservice/Timesheet/getTimeSheetByEmpolyee", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,  // Bearer + token here
    },
    body: JSON.stringify({
      AllRecord: false,
      ExEmployee: false,
      IsLateComing: false,
      PageNumber: 1,
      PageSize: 25,
      SearchTerm: "",
      SortColumn: "EmployeeName",
      SortDirection: "ASC",
      UserId: 128,
      fromDate: "2025-06-05",
      toDate: "2025-06-05",
      isActive: null,
    }),
  })
    .then(res => res.json())
    .then(data => {
      var result = data[0]
      calculateLeaveTime(result.out_Time,result.total_present,"0");
    })
    .catch(err => {
      console.error("API error:", err);
    });
});

function calculateLeaveTime(outRaw,totalhRaw,timeType) {

  if (!outRaw.includes(':')) {
      alert("Please enter OUT TIME in 12-hour format (e.g., 03:45).");
      return;
  }

  requiredTime = getRequiredTime(timeType);

  const totalMinutes = parseTotalTime(totalhRaw);
  if (totalMinutes === null) {
      alert("Please enter a valid TOTAL PRESENT HOURS format (e.g., 6H 45M).");
      return;
  }

  const [outHour, outMinute] = parseOutTime(outRaw);
  if (outHour === null || outMinute === null) {
      alert("Please enter a valid OUT TIME (e.g., 04:15).");
      return;
  }

  const [finalHour, finalMinute] = calculateRequiredOutTime(outHour, outMinute, totalMinutes);
  const now = new Date();

  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const targetTotalMinutes = (now.getHours() >= 12 ? finalHour + 12 : finalHour) * 60 + finalMinute;

  const isLeaveAllowed = currentTotalMinutes >= targetTotalMinutes;
  const gifQuery = isLeaveAllowed ? 'gohome' : 'dontgo';
  const message = isLeaveAllowed
      ? "You can leave, you have completed your hours."
      : `Please wait until ${formatTime(finalHour, finalMinute)}`;

  console.log(gifQuery, message, isLeaveAllowed);
}
function getRequiredTime(type) {
  switch (type) {
      case "1": return 240;
      case "2": return 420;
      case "3": return 510;
      case "4": return 270;
      default:  return 480;
  }
}

function parseTotalTime(input) {
  try {
      const parts = input.split(' ');
      let hours = 0, minutes = 0;

      parts.forEach(part => {
          if (part.includes('H')) hours = parseInt(part);
          if (part.includes('M')) minutes = parseInt(part);
      });

      return (isNaN(hours) ? 0 : hours) * 60 + (isNaN(minutes) ? 0 : minutes);
  } catch {
      return null;
  }
}

function parseOutTime(input) {
  try {
      const [hourStr, minuteStr] = input.split(':');
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);

      if (isNaN(hour) || isNaN(minute)) return [null, null];
      if (hour > 12) hour -= 12;

      return [hour, minute];
  } catch {
      return [null, null];
  }
}

function calculateRequiredOutTime(startHour, startMinute, workedMinutes) {
  let remaining = requiredTime - workedMinutes + 1;

  let finalHour = startHour + Math.floor(remaining / 60);
  let finalMinute = startMinute + (remaining % 60);

  if (finalMinute >= 60) {
      finalHour++;
      finalMinute -= 60;
  }

  if (finalHour > 12) finalHour -= 12;

  return [finalHour, finalMinute];
}

function formatTime(hour, minute) {
  return `${hour < 10 ? '0' + hour : hour}:${minute < 10 ? '0' + minute : minute}`;
}