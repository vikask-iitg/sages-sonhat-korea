// Default timetable data for the Timetable / Arrangements tool.
// Copied unchanged from the school's Smart Substitution Manager (index-v12.html, timetable 2026-27).
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
const PERIOD_BREAKS = { 4: { time: "01:25 - 02:00", label: "Lunch" } };
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

function buildDefaultTimetable() {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
    let tt = {};
    days.forEach(d => {
        tt[d] = {};
        TEACHERS.forEach(t => {
            tt[d][t] = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
        });
    });

    const add = (dayList, teacher, period, desc) => {
        dayList.forEach(d => {
            if (tt[d] && tt[d][teacher]) {
                tt[d][teacher][period].push(desc);
            }
        });
    };

    const ALL = days;

    // CLASS 1
    add(ALL, "Naveen Kumar Bharti", 1, "Class 1 (Hindi)");
    add(ALL, "Pankaj Lakra", 2, "Class 1 (Maths)");
    add(ALL, "Sangeeta Bhagat", 3, "Class 1 (English)");
    add(ALL, "Naveen Kumar Bharti", 4, "Class 1 (Activity)");
    add(ALL, "Pankaj Lakra", 5, "Class 1 (Homework Assign)");
    add(ALL, "Sangeeta Bhagat", 6, "Class 1 (Homework Check)");
    add(ALL, "Naveen Kumar Bharti", 7, "Class 1 (Speaking Skills)");

    // CLASS 2
    add(ALL, "Pankaj Lakra", 1, "Class 2 (Maths)");
    add(ALL, "Lobhesh Kumar Pradhan", 2, "Class 2 (English)");
    add(ALL, "Vibha Rani Thakur", 3, "Class 2 (Homework Assign)");
    add(ALL, "Vibha Rani Thakur", 4, "Class 2 (Activity/Sub)");
    add(ALL, "Sangeeta Bhagat", 5, "Class 2 (Hindi)");
    add(ALL, "MD Asfaque", 6, "Class 2 (Homework Check)");
    add(["MON", "TUE", "WED"], "Vibha Rani Thakur", 7, "Class 2 (Speaking Skills)");
    add(["THU", "FRI", "SAT"], "Lobhesh Kumar Pradhan", 7, "Class 2 (Speaking Skills)");

    // CLASS 3
    add(ALL, "Sangeeta Bhagat", 1, "Class 3 (EVS)");
    add(ALL, "Vibha Rani Thakur", 2, "Class 3 (English)");
    add(ALL, "Pankaj Lakra", 3, "Class 3 (Maths)");
    add(ALL, "Naveen Kumar Bharti", 4, "Class 3 (Hindi)");
    add(ALL, "Lobhesh Kumar Pradhan", 5, "Class 3 (Hindi/Eng Basic)");
    add(ALL, "Pankaj Lakra", 6, "Class 3 (Maths Basic)");
    add(ALL, "Sangeeta Bhagat", 7, "Class 3 (Speaking Skills)");

    // CLASS 4
    add(ALL, "Reenu Jaiswal", 1, "Class 4 (Maths)");
    add(ALL, "Naveen Kumar Bharti", 2, "Class 4 (Hindi)");
    add(ALL, "Ashish Kumar Pandey", 3, "Class 4 (EVS)");
    add(ALL, "Alpna Lakra", 4, "Class 4 (English)");
    add(ALL, "MD Asfaque", 5, "Class 4 (Hindi/Eng Basic)");
    add(ALL, "Reenu Jaiswal", 6, "Class 4 (Maths Basic)");
    add(ALL, "Reenu Jaiswal", 7, "Class 4 (Speaking Skills)");

    // CLASS 5
    add(ALL, "Ashish Kumar Pandey", 1, "Class 5 (EVS)");
    add(ALL, "Reenu Jaiswal", 2, "Class 5 (Maths)");
    add(ALL, "Naveen Kumar Bharti", 3, "Class 5 (Hindi)");
    add(ALL, "Ashish Kumar Pandey", 4, "Class 5 (English)");
    add(ALL, "Reenu Jaiswal", 5, "Class 5 (Maths Basic)");
    add(ALL, "Pravina Sahu", 6, "Class 5 (Hindi/Eng Basic)");
    add(ALL, "Ashish Kumar Pandey", 7, "Class 5 (Speaking Skills)");

    // CLASS 6
    add(ALL, "Kajal Parveen Iraque", 1, "Class 6 (Social)");
    add(ALL, "Keshav Kumar", 2, "Class 6 (Science)");
    add(ALL, "Pravina Sahu", 3, "Class 6 (English)");
    add(ALL, "Lobhesh Kumar Pradhan", 4, "Class 6 (Hindi)");
    add(ALL, "Shalu Tripathi", 5, "Class 6 (Maths)");
    add(ALL, "Ashish Kumar Pandey", 6, "Class 6 (Sanskrit)");
    add(ALL, "Kajal Parveen Iraque", 7, "Class 6 (Khel Yatra/ICT/Art)");

    // CLASS 7
    add(ALL, "Utkarsh Singh", 1, "Class 7 (English)");
    add(ALL, "Shalu Tripathi", 2, "Class 7 (Maths)");
    add(ALL, "Kajal Parveen Iraque", 3, "Class 7 (Social)");
    add(ALL, "Utkarsh Singh", 4, "Class 7 (Hindi)");
    add(ALL, "Keshav Kumar", 5, "Class 7 (Science)");
    add(ALL, "Suman Pandey", 6, "Class 7 (Sanskrit)");
    add(ALL, "Utkarsh Singh", 7, "Class 7 (Khel Yatra/ICT/Art)");

    // CLASS 8
    add(ALL, "Keshav Kumar", 1, "Class 8 (Science)");
    add(ALL, "Suman Pandey", 2, "Class 8 (Sanskrit)");
    add(ALL, "Shalu Tripathi", 3, "Class 8 (Maths)");
    add(ALL, "Chetna Raj", 4, "Class 8 (Hindi)");
    add(ALL, "Kajal Parveen Iraque", 5, "Class 8 (Social)");
    add(ALL, "Utkarsh Singh", 6, "Class 8 (English)");
    add(ALL, "Shivam Kumar", 7, "Class 8 (Khel Yatra/ICT/Art)");

    // CLASS 9
    add(ALL, "Divya Gupta", 1, "Class 9 (Science)");
    add(ALL, "Kalpana Shukla", 2, "Class 9 (Hindi)");
    add(ALL, "Suman Pandey", 3, "Class 9 (Sanskrit)");
    add(ALL, "Chandradeep Panda", 4, "Class 9 (English)");
    add(ALL, "Khushboo Maharaj", 5, "Class 9 (Social Science)");
    add(ALL, "Shivam Kumar", 6, "Class 9 (Maths)");
    add(ALL, "Alpna Lakra", 7, "Class 9 (Revision/Remedial)");

    // CLASS 10
    add(ALL, "Khushboo Maharaj", 1, "Class 10 (Social Science)");
    add(ALL, "Divya Gupta", 2, "Class 10 (Science)");
    add(ALL, "Kalpana Shukla", 3, "Class 10 (Hindi)");
    add(ALL, "Keshav Kumar", 4, "Class 10 (Maths)");
    add(ALL, "Suman Pandey", 5, "Class 10 (Sanskrit)");
    add(ALL, "Chandradeep Panda", 6, "Class 10 (English)");
    add(ALL, "Khushboo Maharaj", 7, "Class 10 (Revision/Remedial)");

    // CLASS 11
    add(ALL, "Alpna Lakra", 1, "Class 11 (Physics)");
    add(ALL, "Nikita Dubey", 1, "Class 11 (Accounts)");
    add(ALL, "Pravina Sahu", 2, "Class 11 (Chemistry)");
    add(ALL, "Chetna Raj", 2, "Class 11 (Economics)");
    add(ALL, "Chandradeep Panda", 3, "Class 11 (English)");
    add(ALL, "Kalpana Shukla", 4, "Class 11 (Hindi)");
    add(ALL, "Shivam Kumar", 5, "Class 11 (Maths)");
    add(ALL, "Divya Gupta", 5, "Class 11 (Biology)");
    add(ALL, "Chetna Raj", 5, "Class 11 (Business)");
    add(["MON", "TUE"], "Vibha Rani Thakur", 6, "Class 11 (Physics Lab)");
    add(["WED", "THU"], "Lobhesh Kumar Pradhan", 6, "Class 11 (Bio Lab)");
    add(["FRI", "SAT"], "Shubhjeet Chandra", 6, "Class 11 (Chem Lab)");
    add(ALL, "Nikita Dubey", 6, "Class 11 (Commerce)");
    add(["MON", "TUE", "WED"], "MD Asfaque", 7, "Class 11 (Library)");
    add(["THU", "FRI", "SAT"], "Shubhjeet Chandra", 7, "Class 11 (Revision)");

    // CLASS 12
    add(ALL, "Chandradeep Panda", 1, "Class 12 (English)");
    add(ALL, "Alpna Lakra", 2, "Class 12 (Physics)");
    add(ALL, "Khushboo Maharaj", 2, "Class 12 (Economics)");
    add(ALL, "Shivam Kumar", 3, "Class 12 (Maths)");
    add(ALL, "Divya Gupta", 3, "Class 12 (Biology)");
    add(ALL, "Nikita Dubey", 3, "Class 12 (Accounts)");
    add(ALL, "Pravina Sahu", 4, "Class 12 (Chemistry)");
    add(ALL, "Nikita Dubey", 4, "Class 12 (Accounts)");
    add(ALL, "Kalpana Shukla", 5, "Class 12 (Hindi)");
    add(["MON", "TUE"], "Shubhjeet Chandra", 6, "Class 12 (Chem Lab)");
    add(["WED", "THU"], "Vibha Rani Thakur", 6, "Class 12 (Physics Lab)");
    add(["FRI", "SAT"], "Lobhesh Kumar Pradhan", 6, "Class 12 (Bio Lab)");
    add(ALL, "Chetna Raj", 6, "Class 12 (Commerce/Business)");
    add(["MON", "TUE", "WED"], "Shubhjeet Chandra", 7, "Class 12 (Revision)");
    add(["THU", "FRI", "SAT"], "MD Asfaque", 7, "Class 12 (Library)");

    // Saturday has its own timetable (replaces the weekday pattern above)
    TEACHERS.forEach(t => { tt.SAT[t] = {}; Object.keys(PERIOD_TIMES_SAT).forEach(p => { tt.SAT[t][p] = []; }); });
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
