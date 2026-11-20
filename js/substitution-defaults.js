// Default timetable data for the Arrangement / Substitution tool.
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

const TEACHERS = [
    "Naveen Bharti",
    "Pankaj Lakra",
    "Sangeeta Bhagat",
    "Reenu Jaiswal",
    "Ashish Pandey",
    "Kajal Parveen",
    "Utkarsh Singh",
    "Keshav Kumar",
    "Divya Gupta",
    "Khushboo Maharaj",
    "Nikita Dubey",
    "Chandradeep Panda",
    "Lobhesh",
    "Vibha",
    "Alpana",
    "Asfaque",
    "Praveena",
    "Chetna",
    "Shalu",
    "Shubhjeet",
    "Suman",
    "Kalpana",
    "Shivam"
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
    add(ALL, "Naveen Bharti", 1, "Class 1 (Hindi)");
    add(ALL, "Pankaj Lakra", 2, "Class 1 (Maths)");
    add(ALL, "Sangeeta Bhagat", 3, "Class 1 (English)");
    add(ALL, "Naveen Bharti", 4, "Class 1 (Activity)");
    add(ALL, "Pankaj Lakra", 5, "Class 1 (Homework Assign)");
    add(ALL, "Sangeeta Bhagat", 6, "Class 1 (Homework Check)");
    add(ALL, "Naveen Bharti", 7, "Class 1 (Speaking Skills)");

    // CLASS 2
    add(ALL, "Pankaj Lakra", 1, "Class 2 (Maths)");
    add(ALL, "Lobhesh", 2, "Class 2 (English)");
    add(ALL, "Vibha", 3, "Class 2 (Homework Assign)");
    add(ALL, "Vibha", 4, "Class 2 (Activity/Sub)");
    add(ALL, "Sangeeta Bhagat", 5, "Class 2 (Hindi)");
    add(ALL, "Asfaque", 6, "Class 2 (Homework Check)");
    add(["MON", "TUE", "WED"], "Vibha", 7, "Class 2 (Speaking Skills)");
    add(["THU", "FRI", "SAT"], "Lobhesh", 7, "Class 2 (Speaking Skills)");

    // CLASS 3
    add(ALL, "Sangeeta Bhagat", 1, "Class 3 (EVS)");
    add(ALL, "Vibha", 2, "Class 3 (English)");
    add(ALL, "Pankaj Lakra", 3, "Class 3 (Maths)");
    add(ALL, "Naveen Bharti", 4, "Class 3 (Hindi)");
    add(ALL, "Lobhesh", 5, "Class 3 (Hindi/Eng Basic)");
    add(ALL, "Pankaj Lakra", 6, "Class 3 (Maths Basic)");
    add(ALL, "Sangeeta Bhagat", 7, "Class 3 (Speaking Skills)");

    // CLASS 4
    add(ALL, "Reenu Jaiswal", 1, "Class 4 (Maths)");
    add(ALL, "Naveen Bharti", 2, "Class 4 (Hindi)");
    add(ALL, "Ashish Pandey", 3, "Class 4 (EVS)");
    add(ALL, "Alpana", 4, "Class 4 (English)");
    add(ALL, "Asfaque", 5, "Class 4 (Hindi/Eng Basic)");
    add(ALL, "Reenu Jaiswal", 6, "Class 4 (Maths Basic)");
    add(ALL, "Reenu Jaiswal", 7, "Class 4 (Speaking Skills)");

    // CLASS 5
    add(ALL, "Ashish Pandey", 1, "Class 5 (EVS)");
    add(ALL, "Reenu Jaiswal", 2, "Class 5 (Maths)");
    add(ALL, "Naveen Bharti", 3, "Class 5 (Hindi)");
    add(ALL, "Ashish Pandey", 4, "Class 5 (English)");
    add(ALL, "Reenu Jaiswal", 5, "Class 5 (Maths Basic)");
    add(ALL, "Praveena", 6, "Class 5 (Hindi/Eng Basic)");
    add(ALL, "Ashish Pandey", 7, "Class 5 (Speaking Skills)");

    // CLASS 6
    add(ALL, "Kajal Parveen", 1, "Class 6 (Social)");
    add(ALL, "Keshav Kumar", 2, "Class 6 (Science)");
    add(ALL, "Praveena", 3, "Class 6 (English)");
    add(ALL, "Lobhesh", 4, "Class 6 (Hindi)");
    add(ALL, "Shalu", 5, "Class 6 (Maths)");
    add(ALL, "Ashish Pandey", 6, "Class 6 (Sanskrit)");
    add(ALL, "Kajal Parveen", 7, "Class 6 (Khel Yatra/ICT/Art)");

    // CLASS 7
    add(ALL, "Utkarsh Singh", 1, "Class 7 (English)");
    add(ALL, "Shalu", 2, "Class 7 (Maths)");
    add(ALL, "Kajal Parveen", 3, "Class 7 (Social)");
    add(ALL, "Utkarsh Singh", 4, "Class 7 (Hindi)");
    add(ALL, "Keshav Kumar", 5, "Class 7 (Science)");
    add(ALL, "Suman", 6, "Class 7 (Sanskrit)");
    add(ALL, "Utkarsh Singh", 7, "Class 7 (Khel Yatra/ICT/Art)");

    // CLASS 8
    add(ALL, "Keshav Kumar", 1, "Class 8 (Science)");
    add(ALL, "Suman", 2, "Class 8 (Sanskrit)");
    add(ALL, "Shalu", 3, "Class 8 (Maths)");
    add(ALL, "Chetna", 4, "Class 8 (Hindi)");
    add(ALL, "Kajal Parveen", 5, "Class 8 (Social)");
    add(ALL, "Utkarsh Singh", 6, "Class 8 (English)");
    add(ALL, "Shivam", 7, "Class 8 (Khel Yatra/ICT/Art)");

    // CLASS 9
    add(ALL, "Divya Gupta", 1, "Class 9 (Science)");
    add(ALL, "Kalpana", 2, "Class 9 (Hindi)");
    add(ALL, "Suman", 3, "Class 9 (Sanskrit)");
    add(ALL, "Chandradeep Panda", 4, "Class 9 (English)");
    add(ALL, "Khushboo Maharaj", 5, "Class 9 (Social Science)");
    add(ALL, "Shivam", 6, "Class 9 (Maths)");
    add(ALL, "Alpana", 7, "Class 9 (Revision/Remedial)");

    // CLASS 10
    add(ALL, "Khushboo Maharaj", 1, "Class 10 (Social Science)");
    add(ALL, "Divya Gupta", 2, "Class 10 (Science)");
    add(ALL, "Kalpana", 3, "Class 10 (Hindi)");
    add(ALL, "Keshav Kumar", 4, "Class 10 (Maths)");
    add(ALL, "Suman", 5, "Class 10 (Sanskrit)");
    add(ALL, "Chandradeep Panda", 6, "Class 10 (English)");
    add(ALL, "Khushboo Maharaj", 7, "Class 10 (Revision/Remedial)");

    // CLASS 11
    add(ALL, "Alpana", 1, "Class 11 (Physics)");
    add(ALL, "Nikita Dubey", 1, "Class 11 (Accounts)");
    add(ALL, "Praveena", 2, "Class 11 (Chemistry)");
    add(ALL, "Chetna", 2, "Class 11 (Economics)");
    add(ALL, "Chandradeep Panda", 3, "Class 11 (English)");
    add(ALL, "Kalpana", 4, "Class 11 (Hindi)");
    add(ALL, "Shivam", 5, "Class 11 (Maths)");
    add(ALL, "Divya Gupta", 5, "Class 11 (Biology)");
    add(ALL, "Chetna", 5, "Class 11 (Business)");
    add(["MON", "TUE"], "Vibha", 6, "Class 11 (Physics Lab)");
    add(["WED", "THU"], "Lobhesh", 6, "Class 11 (Bio Lab)");
    add(["FRI", "SAT"], "Shubhjeet", 6, "Class 11 (Chem Lab)");
    add(ALL, "Nikita Dubey", 6, "Class 11 (Commerce)");
    add(["MON", "TUE", "WED"], "Asfaque", 7, "Class 11 (Library)");
    add(["THU", "FRI", "SAT"], "Shubhjeet", 7, "Class 11 (Revision)");

    // CLASS 12
    add(ALL, "Chandradeep Panda", 1, "Class 12 (English)");
    add(ALL, "Alpana", 2, "Class 12 (Physics)");
    add(ALL, "Khushboo Maharaj", 2, "Class 12 (Economics)");
    add(ALL, "Shivam", 3, "Class 12 (Maths)");
    add(ALL, "Divya Gupta", 3, "Class 12 (Biology)");
    add(ALL, "Nikita Dubey", 3, "Class 12 (Accounts)");
    add(ALL, "Praveena", 4, "Class 12 (Chemistry)");
    add(ALL, "Nikita Dubey", 4, "Class 12 (Accounts)");
    add(ALL, "Kalpana", 5, "Class 12 (Hindi)");
    add(["MON", "TUE"], "Shubhjeet", 6, "Class 12 (Chem Lab)");
    add(["WED", "THU"], "Vibha", 6, "Class 12 (Physics Lab)");
    add(["FRI", "SAT"], "Lobhesh", 6, "Class 12 (Bio Lab)");
    add(ALL, "Chetna", 6, "Class 12 (Commerce/Business)");
    add(["MON", "TUE", "WED"], "Shubhjeet", 7, "Class 12 (Revision)");
    add(["THU", "FRI", "SAT"], "Asfaque", 7, "Class 12 (Library)");

    return tt;
}
