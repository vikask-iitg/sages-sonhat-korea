// Default timetable data for the Timetable / Arrangements tool: the school's 2026-27 timetable
// (Monday – Friday sheet W.E.F 16/06/2026 and the Saturday sheet).
// The admin can edit the timetable from the admin panel; these values are only the starting point.

const PERIOD_TIMES = {
    1: "10:15 - 11:05",
    2: "11:05 - 11:50",
    3: "12:00 - 12:45",
    4: "12:45 - 01:25",
    5: "02:00 - 02:45",
    6: "02:45 - 03:25",
    7: "03:25 - 04:00"
};

// Saturday (session 2026-27): a shorter day — Bagless Day for Classes 1–8, revision for Classes 9–12.
// Lunch 10:30 – 11:00 sits between P-5 and P-6.
const PERIOD_TIMES_SAT = {
    1: "08:00 - 08:30",
    2: "08:30 - 09:00",
    3: "09:00 - 09:30",
    4: "09:30 - 10:00",
    5: "10:00 - 10:30",
    6: "11:00 - 11:30"
};

// Breaks between periods: { after period: { time, label } }
const PERIOD_BREAKS = { 2: { time: "11:50 - 12:00", label: "Short break" }, 4: { time: "01:25 - 02:00", label: "Lunch" } };
const PERIOD_BREAKS_SAT = { 5: { time: "10:30 - 11:00", label: "Lunch" } };

// Saturday timetable from the school's "Saturday Time Table, Session 2026-27" sheet: [period, teacher, class (subject)]
const SATURDAY_TIMETABLE = (() => {
    const B = "Bagless Activity", R = s => `Revision – ${s}`;
    // Classes 1–8 per period: teachers for Class 1, 2, … 8 (all Bagless Activity)
    const bagless = {
        1: ["Naveen Kumar Bharti", "Pankaj Lakra", "Sangeeta Bhagat", "Reenu Jaiswal", "Ashish Kumar Pandey", "Kajal Parveen Iraque", "Utkarsh Singh", "Keshav Kumar"],
        2: ["Sangeeta Bhagat", "Vibha Rani Thakur", "Pankaj Lakra", "Ashish Kumar Pandey", "Reenu Jaiswal", "Utkarsh Singh", "Shalu Tripathi", "Suman Pandey"],
        3: ["MD Asfaque", "Lobhesh Kumar Pradhan", "Vibha Rani Thakur", "Naveen Kumar Bharti", "Shubhjeet Chandra", "Suman Pandey", "Kajal Parveen Iraque", "Keshav Kumar"],
        4: ["Pankaj Lakra", "MD Asfaque", "Shubhjeet Chandra", "Alpna Lakra", "Pravina Sahu", "Keshav Kumar", "Utkarsh Singh", "Shalu Tripathi"],
        5: ["Vibha Rani Thakur", "Sangeeta Bhagat", "MD Asfaque", "Shubhjeet Chandra", "Lobhesh Kumar Pradhan", "Shalu Tripathi", "Keshav Kumar", "Kajal Parveen Iraque"],
        6: ["Naveen Kumar Bharti", "Naveen Kumar Bharti", "Lobhesh Kumar Pradhan", "Reenu Jaiswal", "Ashish Kumar Pandey", "Kajal Parveen Iraque", "Shalu Tripathi", "Utkarsh Singh"],
    };
    // Classes 9–12: [period, class, teacher, subject]
    const higher = [
        [1, 9, "Divya Gupta", "Science"], [1, 10, "Khushboo Maharaj", "Social Science"],
        [1, 11, "Alpna Lakra", "Physics"], [1, 11, "Nikita Dubey", "Accounts"], [1, 12, "Chandradeep Panda", "English"],
        [2, 9, "Kalpana Shukla", "Hindi"], [2, 10, "Shivam Kumar", "Maths"],
        [2, 11, "Pravina Sahu", "Chemistry"], [2, 11, "Chetna Raj", "Economics"],
        [2, 12, "Alpna Lakra", "Physics"], [2, 12, "Khushboo Maharaj", "Economics"],
        [3, 9, "Shivam Kumar", "Maths"], [3, 10, "Kalpana Shukla", "Hindi"], [3, 11, "Chandradeep Panda", "English"],
        [3, 12, "Pravina Sahu", "Chemistry"], [3, 12, "Chetna Raj", "Business"],
        [4, 9, "Chandradeep Panda", "English"], [4, 10, "Suman Pandey", "Sanskrit"], [4, 11, "Kalpana Shukla", "Hindi"],
        [4, 12, "Shivam Kumar", "Maths"], [4, 12, "Divya Gupta", "Biology"], [4, 12, "Nikita Dubey", "Accounts"],
        [5, 9, "Khushboo Maharaj", "Social Science"], [5, 10, "Chandradeep Panda", "English"],
        [5, 11, "Divya Gupta", "Maths / Biology"], [5, 11, "Chetna Raj", "Business"], [5, 12, "Kalpana Shukla", "Hindi"],
        [6, 9, "Suman Pandey", "Sanskrit"], [6, 10, "Divya Gupta", "Science"],
        [6, 11, "Alpna Lakra", "Weekly Test"], [6, 11, "Chetna Raj", "Weekly Test"], [6, 11, "Khushboo Maharaj", "Weekly Test"],
        [6, 12, "Pravina Sahu", "Weekly Test"], [6, 12, "Nikita Dubey", "Weekly Test"],
    ];
    const list = [];
    Object.entries(bagless).forEach(([p, names]) => names.forEach((t, k) => list.push([Number(p), t, `Class ${k + 1} (${B})`])));
    higher.forEach(([p, c, t, sub]) => list.push([p, t, `Class ${c} (${R(sub)})`]));
    return list;
})();

const TEACHERS = [
    "Naveen Kumar Bharti",
    "Pankaj Lakra",
    "Sangeeta Bhagat",
    "Reenu Jaiswal",
    "Ashish Kumar Pandey",
    "Kajal Parveen Iraque",
    "Utkarsh Singh",
    "Keshav Kumar",
    "Divya Gupta",
    "Khushboo Maharaj",
    "Nikita Dubey",
    "Chandradeep Panda",
    "Lobhesh Kumar Pradhan",
    "Vibha Rani Thakur",
    "Alpna Lakra",
    "MD Asfaque",
    "Pravina Sahu",
    "Chetna Raj",
    "Shalu Tripathi",
    "Shubhjeet Chandra",
    "Suman Pandey",
    "Kalpana Shukla",
    "Shivam Kumar"
];

// Monday – Friday timetable from the school's "Time Table for Session 2026-27, W.E.F 16/06/2026" (prayer 10:00–10:15).
// [period, class, teacher, subject, days?] — days only where an entry is not every weekday.
const WEEKDAY_TIMETABLE = (() => {
    const N = "Naveen Kumar Bharti", PK = "Pankaj Lakra", SG = "Sangeeta Bhagat", RJ = "Reenu Jaiswal", AP = "Ashish Kumar Pandey",
        KP = "Kajal Parveen Iraque", US = "Utkarsh Singh", KK = "Keshav Kumar", DG = "Divya Gupta", KM = "Khushboo Maharaj",
        ND = "Nikita Dubey", CP = "Chandradeep Panda", LP = "Lobhesh Kumar Pradhan", VT = "Vibha Rani Thakur", AL = "Alpna Lakra",
        MA = "MD Asfaque", PS = "Pravina Sahu", CR = "Chetna Raj", ST = "Shalu Tripathi", SC = "Shubhjeet Chandra",
        SP = "Suman Pandey", KS = "Kalpana Shukla", SK = "Shivam Kumar";
    const KHEL = "Khel Yatra / ICT / Vocational & Art Education";
    return [
        // P-1 10:15 – 11:05
        [1, 1, N, "Hindi"], [1, 2, PK, "Maths"], [1, 3, SG, "EVS"], [1, 4, RJ, "Maths"], [1, 5, AP, "EVS"], [1, 6, KP, "Social"],
        [1, 7, US, "English"], [1, 8, KK, "Science"], [1, 9, DG, "Science"], [1, 10, KM, "Social Science"],
        [1, 11, AL, "Physics"], [1, 11, ND, "Accounts"], [1, 12, CP, "English"],
        // P-2 11:05 – 11:50
        [2, 1, PK, "Maths"], [2, 2, LP, "English"], [2, 3, VT, "English"], [2, 4, N, "Hindi"], [2, 5, RJ, "Maths"], [2, 6, KK, "Science"],
        [2, 7, ST, "Maths"], [2, 8, SP, "Sanskrit"], [2, 9, KS, "Hindi"], [2, 10, DG, "Science"],
        [2, 11, PS, "Chemistry"], [2, 11, CR, "Economics"], [2, 12, AL, "Physics"], [2, 12, KM, "Economics"],
        // short break 11:50 – 12:00; P-3 12:00 – 12:45
        [3, 1, SG, "English"], [3, 2, VT, "Homework Assign"], [3, 3, PK, "Maths"], [3, 4, AP, "EVS"], [3, 5, N, "Hindi"], [3, 6, PS, "English"],
        [3, 7, KP, "Social"], [3, 8, ST, "Maths"], [3, 9, SP, "Sanskrit"], [3, 10, KS, "Hindi"], [3, 11, CP, "English"],
        [3, 12, SK, "Maths"], [3, 12, DG, "Biology"], [3, 12, ND, "Accounts"],
        // P-4 12:45 – 01:25 (Classes 1 and 2 together for Activity with Vibha)
        [4, 1, VT, "Activity"], [4, 2, VT, "Activity"], [4, 3, N, "Hindi"], [4, 4, AL, "English"], [4, 5, AP, "English"], [4, 6, LP, "Hindi"],
        [4, 7, US, "Hindi"], [4, 8, CR, "Hindi"], [4, 9, CP, "English"], [4, 10, KK, "Maths"], [4, 11, KS, "Hindi"],
        [4, 12, PS, "Chemistry"], [4, 12, ND, "Accounts"],
        // lunch 01:25 – 02:00; P-5 02:00 – 02:45
        [5, 1, PK, "Homework Assign"], [5, 2, SG, "Hindi"], [5, 3, LP, "Hindi/Eng Basic"], [5, 4, MA, "Hindi/Eng Basic"], [5, 5, RJ, "Maths Basic"],
        [5, 6, ST, "Maths"], [5, 7, KK, "Science"], [5, 8, KP, "Social"], [5, 9, KM, "Social Science"], [5, 10, SP, "Sanskrit"],
        [5, 11, SK, "Maths"], [5, 11, DG, "Biology"], [5, 11, CR, "Business"], [5, 12, KS, "Hindi"],
        // P-6 02:45 – 03:25
        [6, 1, SG, "Homework Checking"], [6, 2, MA, "Homework Checking"], [6, 3, PK, "Maths Basic"], [6, 4, RJ, "Maths Basic"], [6, 5, PS, "Hindi/Eng Basic"],
        [6, 6, AP, "Sanskrit"], [6, 7, SP, "Sanskrit"], [6, 8, US, "English"], [6, 9, SK, "Maths"], [6, 10, CP, "English"],
        [6, 11, VT, "Physics Lab", ["MON", "TUE"]], [6, 11, LP, "Bio Lab", ["WED", "THU"]], [6, 11, SC, "Chem Lab", ["FRI"]], [6, 11, ND, "Commerce"],
        [6, 12, SC, "Chem Lab", ["MON", "TUE"]], [6, 12, VT, "Physics Lab", ["WED", "THU"]], [6, 12, LP, "Bio Lab", ["FRI"]], [6, 12, CR, "Commerce/Business"],
        // P-7 03:25 – 04:00
        [7, 1, N, "Speaking Skills"], [7, 2, VT, "Speaking Skills", ["MON", "TUE", "WED"]], [7, 2, LP, "Speaking Skills", ["THU", "FRI"]],
        [7, 3, SG, "Speaking Skills"], [7, 4, RJ, "Speaking Skills"], [7, 5, AP, "Speaking Skills"],
        [7, 6, KP, KHEL], [7, 7, US, KHEL], [7, 8, SK, KHEL], [7, 9, AL, "Revision/Remedial"], [7, 10, KM, "Revision/Remedial"],
        [7, 11, MA, "Library", ["MON", "TUE", "WED"]], [7, 11, SC, "Revision", ["THU", "FRI"]],
        [7, 12, SC, "Revision", ["MON", "TUE", "WED"]], [7, 12, MA, "Library", ["THU", "FRI"]],
    ];
})();

function buildDefaultTimetable() {
    const WEEK = ["MON", "TUE", "WED", "THU", "FRI"];
    const tt = {};
    [...WEEK, "SAT"].forEach(d => {
        tt[d] = {};
        const periods = Object.keys(d === "SAT" ? PERIOD_TIMES_SAT : PERIOD_TIMES);
        TEACHERS.forEach(t => { tt[d][t] = Object.fromEntries(periods.map(p => [p, []])); });
    });
    WEEKDAY_TIMETABLE.forEach(([p, c, t, sub, days]) => (days || WEEK).forEach(d => { if (tt[d][t]) tt[d][t][p].push(`Class ${c} (${sub})`); }));
    SATURDAY_TIMETABLE.forEach(([p, t, desc]) => { if (tt.SAT[t]) tt.SAT[t][p].push(desc); });
    return tt;
}

// Short names used by the original phone app → full names from the website's staff list.
// Saved data that still uses a short name is converted when the admin tool loads it.
const LEGACY_NAMES = {
    "Naveen Bharti": "Naveen Kumar Bharti",
    "Pankaj Lakra": "Pankaj Lakra",
    "Sangeeta Bhagat": "Sangeeta Bhagat",
    "Reenu Jaiswal": "Reenu Jaiswal",
    "Ashish Pandey": "Ashish Kumar Pandey",
    "Kajal Parveen": "Kajal Parveen Iraque",
    "Utkarsh Singh": "Utkarsh Singh",
    "Keshav Kumar": "Keshav Kumar",
    "Divya Gupta": "Divya Gupta",
    "Khushboo Maharaj": "Khushboo Maharaj",
    "Nikita Dubey": "Nikita Dubey",
    "Chandradeep Panda": "Chandradeep Panda",
    "Lobhesh": "Lobhesh Kumar Pradhan",
    "Vibha": "Vibha Rani Thakur",
    "Alpana": "Alpna Lakra",
    "Asfaque": "MD Asfaque",
    "Praveena": "Pravina Sahu",
    "Chetna": "Chetna Raj",
    "Shalu": "Shalu Tripathi",
    "Shubhjeet": "Shubhjeet Chandra",
    "Suman": "Suman Pandey",
    "Kalpana": "Kalpana Shukla",
    "Shivam": "Shivam Kumar"
};
