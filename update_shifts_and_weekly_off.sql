-- ==========================================================================
-- BAMBINOS HRMS - SHIFT & WEEKLY OFF IMPORT SQL SCRIPT
-- Source File    : shift_and_week_off .csv  (roster is the source of truth)
-- Names From     : employees.csv
-- Total Records  : 151 employees updated
-- Generated At   : 2026-10-02T10:54:02.169Z
-- Targeting      : WHERE employee_code = '<Emp No from roster>'  (unique key)
--                  No BAM- codes, no email, no name matching.
-- Untouched      : 1 roster rows with no data, 27 employees not in roster
-- ==========================================================================

START TRANSACTION;

-- ==========================================================================
-- SECTION 1: SHIFT + WEEKLY OFF (151 employees)
-- ==========================================================================

-- Rhea Diwan (Emp No: 10) - Weekly Off: Sun | Shift: 20:00:00 - 05:00:00 (20-5)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '20:00:00',
    shift_end = '05:00:00',
    updated_at = NOW()
WHERE employee_code = '10';

-- Aparna Sharma (Emp No: 109) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '109';

-- Vijay Dash (Emp No: 123) - Weekly Off: Mon | Shift: 23:00:00 - 08:00:00 (23-8)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '23:00:00',
    shift_end = '08:00:00',
    updated_at = NOW()
WHERE employee_code = '123';

-- Kalpana Poojary (Emp No: 138) - Weekly Off: Sun | Shift: 11:00:00 - 20:00:00 (11-8)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '138';

-- Lezniak (Emp No: 142) - Weekly Off: Sat,Sun [Sunx4 Satx2] | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sat,Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '142';

-- Kiran Kumari (Emp No: 146) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '146';

-- Rina Purushottam Asai (Emp No: 151) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '151';

-- Diksha Varma (Emp No: 159) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '159';

-- Asma Arshad (Emp No: 161) - Weekly Off: Sat,Sun [Sunx4 Satx2] | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sat,Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '161';

-- J. Bal Krishna (Emp No: 171) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '171';

-- Sagar Dolui (Emp No: 18) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '18';

-- Rohan Jaiswal (Emp No: 181) - Weekly Off: Thu | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '181';

-- Swagata Ghosh (Emp No: 188) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '188';

-- Monika Mittal (Emp No: 192) - Weekly Off: Sun | Shift: 09:00:00 - 18:00:00 (9T6)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '09:00:00',
    shift_end = '18:00:00',
    updated_at = NOW()
WHERE employee_code = '192';

-- Arpita (Emp No: 193) - Weekly Off: Sun | Shift: 11:00:00 - 20:00:00 (11-8) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '193';

-- Loraine Warren (Emp No: 194) - Weekly Off: Tue | Shift: 16:00:00 - 01:00:00 (16-1)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '194';

-- Barkha Gehani (Emp No: 195) - Weekly Off: Mon | Shift: 08:00:00 - 17:00:00 (8-5)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '08:00:00',
    shift_end = '17:00:00',
    updated_at = NOW()
WHERE employee_code = '195';

-- Sajan Tomar (Emp No: 199) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7) [10-7x14 6-3x9]
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '199';

-- Ashish Gupta (Emp No: 2) - Weekly Off: Sun | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '2';

-- Divyalika Mishra (Emp No: 207) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '207';

-- Kanishka Chawla (Emp No: 213) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '213';

-- Chirantan Bhattacharjee (Emp No: 222) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '222';

-- Sonal Bhati (Emp No: 226) - Weekly Off: Fri | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Fri',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '226';

-- Arti Sharma (Emp No: 233) - Weekly Off: Thu | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '233';

-- Nikita Arora (Emp No: 235) - Weekly Off: Sun | Shift: 16:00:00 - 01:00:00 (16-1)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '235';

-- Jyoti Daima (Emp No: 238) - Weekly Off: Mon | Shift: 13:00:00 - 23:00:00 (1-11) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '238';

-- Seema J Mandakki (Emp No: 244) - Weekly Off: Tue | Shift: 16:00:00 - 01:00:00 (16-1)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '244';

-- Abhisha Das (Emp No: 245) - Weekly Off: Wed | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '245';

-- Avni Sharma (Emp No: 261) - Weekly Off: Sun | Shift: 11:00:00 - 20:00:00 (11-8)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '261';

-- Moumita Mondal (Emp No: 262) - Weekly Off: Tue | Shift: 11:00:00 - 20:00:00 (11-8)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '262';

-- Shaily Verma (Emp No: 271) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '271';

-- Monica Yadav (Emp No: 272) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '272';

-- Sandhiya Veeramani (Emp No: 285) - Weekly Off: Fri | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Fri',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '285';

-- Mriduta Pal Gupta (Emp No: 289) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '289';

-- Asutosh Kumar (Emp No: 296) - Weekly Off: Tue | Shift: 23:00:00 - 08:00:00 (23-8)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '23:00:00',
    shift_end = '08:00:00',
    updated_at = NOW()
WHERE employee_code = '296';

-- Jasprakash Johari (Emp No: 3) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '3';

-- Tridib Chakraborty (Emp No: 330) - Weekly Off: Wed | Shift: 13:00:00 - 23:00:00 (1-11)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '330';

-- Pranava Madan (Emp No: 332) - Weekly Off: Mon | Shift: 13:00:00 - 23:00:00 (1-11)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '332';

-- Ashi Gupta (Emp No: 334) - Weekly Off: Wed | Shift: 16:00:00 - 01:00:00 (16-1)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '334';

-- Navjot Kaur (Emp No: 349) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '349';

-- Arifa Sultana (Emp No: 357) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '357';

-- Vishali C (Emp No: 361) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '361';

-- Sarthak Wattal (Emp No: 363) - Weekly Off: Wed | Shift: 13:00:00 - 23:00:00 (1-11)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '363';

-- Afroja Sultana (Emp No: 369) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '369';

-- Senator Angom (Emp No: 38) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '38';

-- Durga Tejaswini H (Emp No: 383) - Weekly Off: Thu | Shift: 16:00:00 - 01:00:00 (16-1) [16-1x15 6-3x8] | employees.csv had 6-3, roster wins
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '383';

-- Ananya N (Emp No: 391) - Weekly Off: Mon | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '391';

-- Amantika Mittal (Emp No: 399) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '399';

-- Subhajyoti Nag (Emp No: 405) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '405';

-- Ishika Gupta (Emp No: 416) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '416';

-- Harshul Rathore (Emp No: 417) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '417';

-- Edgar Lester Dsouza (Emp No: 418) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '418';

-- Aashutosh Patel (Emp No: 433) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '433';

-- Srishti Mehra (Emp No: 441) - Weekly Off: Thu | Shift: 13:00:00 - 23:00:00 (1-11) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '441';

-- Mohammed Aslam V (Emp No: 457) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '457';

-- Urvi Sharma (Emp No: 462) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '462';

-- Siddharth Prabhakar (Emp No: 464) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '464';

-- Pooja Sethi (Emp No: 467) - Weekly Off: Sat | Shift: 16:00:00 - 01:00:00 (16-1)
UPDATE hrms_employees
SET weekly_off = 'Sat',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '467';

-- Levishka (Emp No: 468) - Weekly Off: Thu | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '468';

-- Ramesh R (Emp No: 469) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '469';

-- Pragya Prantika Das (Emp No: 473) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '473';

-- Kaushiki Kumari (Emp No: 478) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '478';

-- Anmol Kapoor (Emp No: 492) - Weekly Off: Tue | Shift: 13:00:00 - 22:00:00 (AF1)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '13:00:00',
    shift_end = '22:00:00',
    updated_at = NOW()
WHERE employee_code = '492';

-- Subroto Debnath (Emp No: 494) - Weekly Off: Tue | Shift: 13:00:00 - 23:00:00 (1-11)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '494';

-- Muhammed Shafi (Emp No: 499) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '499';

-- Aksa Sayeed (Emp No: 504) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '504';

-- Mahjabin (Emp No: 505) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '505';

-- Sohaib Gayas (Emp No: 508) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '508';

-- Aparna Meher (Emp No: 527) - Weekly Off: Sun | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '527';

-- Akshiv Mittal (Emp No: 533) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '533';

-- Tashu Kalra (Emp No: 554) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '554';

-- Harmandeep Kaur (Emp No: 555) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '555';

-- Bhiva (Emp No: 557) - Weekly Off: Thu | Shift: 13:00:00 - 23:00:00 (1-11)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '557';

-- Muskan K Jaswani (Emp No: 558) - Weekly Off: Wed | Shift: 13:00:00 - 23:00:00 (1-11)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '13:00:00',
    shift_end = '23:00:00',
    updated_at = NOW()
WHERE employee_code = '558';

-- Mirnal Mangaraj (Emp No: 561) - Weekly Off: Wed | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '561';

-- Millind Sinha (Emp No: 563) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '563';

-- Poonam Singh (Emp No: 566) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '566';

-- Dnyaneshwari Ramdas Pandharkar (Emp No: 570) - Weekly Off: Fri | Shift: 08:00:00 - 17:00:00 (8-5)
UPDATE hrms_employees
SET weekly_off = 'Fri',
    shift_start = '08:00:00',
    shift_end = '17:00:00',
    updated_at = NOW()
WHERE employee_code = '570';

-- Akanksha Jitendra Chaudhari (Emp No: 571) - Weekly Off: Thu | Shift: 04:00:00 - 13:00:00 (4-13)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '04:00:00',
    shift_end = '13:00:00',
    updated_at = NOW()
WHERE employee_code = '571';

-- Aleesha Mufthi AS (Emp No: 575) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '575';

-- Agrim Kumar (Emp No: 578) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '578';

-- Aditya Santosh Mutha (Emp No: 579) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '579';

-- Nandini Bhardwaj (Emp No: 581) - Weekly Off: Mon | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '581';

-- Anushka Singh (Emp No: 582) - Weekly Off: Tue [Thux1 Tuex2] | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '582';

-- Ruchi Kumari (Emp No: 583) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '583';

-- Lalit Rajawat (Emp No: 584) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '584';

-- Vignesh Babu Muruganantham (Emp No: 585) - Weekly Off: Thu | Shift: 23:00:00 - 08:00:00 (23-8)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '23:00:00',
    shift_end = '08:00:00',
    updated_at = NOW()
WHERE employee_code = '585';

-- Ibrar Aansari (Emp No: 586) - Weekly Off: Thu | Shift: 16:00:00 - 01:00:00 (16-1)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '16:00:00',
    shift_end = '01:00:00',
    updated_at = NOW()
WHERE employee_code = '586';

-- M PURUSHOTHAM (Emp No: 587) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '587';

-- Bhosale Chaitnya Hari (Emp No: 588) - Weekly Off: Fri | Shift: 23:00:00 - 08:00:00 (23-8)
UPDATE hrms_employees
SET weekly_off = 'Fri',
    shift_start = '23:00:00',
    shift_end = '08:00:00',
    updated_at = NOW()
WHERE employee_code = '588';

-- Priyansu Satapathy (Emp No: 589) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '589';

-- Abhishek Vashisth (Emp No: 591) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '591';

-- Harshini Vudimudi (Emp No: 592) - Weekly Off: Thu | Shift: 08:00:00 - 17:00:00 (8-5)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '08:00:00',
    shift_end = '17:00:00',
    updated_at = NOW()
WHERE employee_code = '592';

-- Monu Raj (Emp No: 594) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '594';

-- Sambhav Singh (Emp No: 598) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '598';

-- Aman Kumar Sharma (Emp No: 599) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '599';

-- Gaurav Brar (Emp No: 61) - Weekly Off: Tue | Shift: 11:00:00 - 21:00:00 (11-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '11:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '61';

-- Ishbha Jain (Emp No: 610) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '610';

-- Vaibhav Badopalia (Emp No: 613) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '613';

-- Digvijaya Balija (Emp No: 616) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '616';

-- Gargi Vivek Agrawal (Emp No: 620) - Weekly Off: Tue [Wedx1 Tuex2] | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '620';

-- Aman Kumar Jha (Emp No: 621) - Weekly Off: Mon | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '621';

-- Bishal Kumar (Emp No: 622) - Weekly Off: Sun | Shift: 11:00:00 - 20:00:00 (11-8)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '622';

-- Deepak Ashokrao Jadhav (Emp No: 623) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '623';

-- Gaurvi Verma (Emp No: 626) - Weekly Off: Mon | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '626';

-- Arsh Sagar (Emp No: 627) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '627';

-- N N V Rohini Vishnu Priya Devi (Emp No: 629) - Weekly Off: Thu | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '629';

-- Vinti Sandeep Jain (Emp No: 637) - Weekly Off: Mon | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '637';

-- Amrita Ashok Vishwakarma (Emp No: 638) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '638';

-- Avinash Anandrao Birajdar (Emp No: 639) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '639';

-- Sagnik Maitra (Emp No: 642) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '642';

-- Ruchi Gupta (Emp No: 643) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '643';

-- Arsh Preet Singh (Emp No: 644) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '644';

-- Aryan Deep Singh (Emp No: 645) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '645';

-- Manya Ahuja (Emp No: 646) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '646';

-- Sanjukta Behera (Emp No: 647) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '647';

-- Shyam Sundra Pareek (Emp No: 650) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '650';

-- Sachin Somashekar Kamagond (Emp No: 654) - Weekly Off: Sun | Shift: 11:00:00 - 20:00:00 (11-8)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '654';

-- Nikhil Bagri (Emp No: 655) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '655';

-- Priyal Rathi (Emp No: 659) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '659';

-- Tanushri Gaur (Emp No: 660) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '660';

-- Kreeteeka Srivastava (Emp No: 661) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '661';

-- Rumita Dey (Emp No: 662) - Weekly Off: Wed | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '662';

-- Vinit Kumar Nishad (Emp No: 664) - Weekly Off: Fri [Monx1 Frix3] | Shift: 05:00:00 - 14:00:00 (5-2) [5-2x16 12-9x5] | employees.csv had 12-9, roster wins
UPDATE hrms_employees
SET weekly_off = 'Fri',
    shift_start = '05:00:00',
    shift_end = '14:00:00',
    updated_at = NOW()
WHERE employee_code = '664';

-- Smitha Shree M (Emp No: 667) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '667';

-- Deeraj GR (Emp No: 672) - Weekly Off: Sat | Shift: 08:00:00 - 17:00:00 (8-5)
UPDATE hrms_employees
SET weekly_off = 'Sat',
    shift_start = '08:00:00',
    shift_end = '17:00:00',
    updated_at = NOW()
WHERE employee_code = '672';

-- Isha Kalbalia (Emp No: 673) - Weekly Off: Thu | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '673';

-- Akshita Shrivastava (Emp No: 674) - Weekly Off: Wed,Thu [Thux2 Wedx2] | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Wed,Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '674';

-- Muskan Fathima (Emp No: 678) - Weekly Off: Wed | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Wed',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '678';

-- Syeda Fariah Rahman (Emp No: 680) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '680';

-- Keshav Sarda (Emp No: 685) - Weekly Off: Tue,Thu [Tuex2 Thux2] | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Tue,Thu',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '685';

-- Avantika Suresh Nambiar (Emp No: 687) - Weekly Off: Mon | Shift: 09:00:00 - 19:00:00 (9-7)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '09:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '687';

-- Anindyasundar Roy (Emp No: 691) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '691';

-- Utkarsh Singh (Emp No: 692) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '692';

-- Dhanushree C (Emp No: 694) - Weekly Off: Mon | Shift: 13:00:00 - 22:00:00 (AF1)
UPDATE hrms_employees
SET weekly_off = 'Mon',
    shift_start = '13:00:00',
    shift_end = '22:00:00',
    updated_at = NOW()
WHERE employee_code = '694';

-- Priyansh Kashyap (Emp No: 695) - Weekly Off: Tue | Shift: 12:00:00 - 21:00:00 (12-9) | not in employees.csv
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '695';

-- Jaya Shree K (Emp No: 698) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '698';

-- Manas Mishra (Emp No: 699) - Weekly Off: Sun | Shift: 11:00:00 - 20:00:00 (11-8)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '11:00:00',
    shift_end = '20:00:00',
    updated_at = NOW()
WHERE employee_code = '699';

-- Zaid Iqbal (Emp No: 700) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '700';

-- Vathsala G (Emp No: 701) - Weekly Off: Sun | Shift: 09:00:00 - 18:00:00 (9T6)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '09:00:00',
    shift_end = '18:00:00',
    updated_at = NOW()
WHERE employee_code = '701';

-- Nishikant Say (Emp No: 704) - Weekly Off: Tue | Shift: 13:00:00 - 22:00:00 (AF1)
UPDATE hrms_employees
SET weekly_off = 'Tue',
    shift_start = '13:00:00',
    shift_end = '22:00:00',
    updated_at = NOW()
WHERE employee_code = '704';

-- Reetika Baweja (Emp No: 705) - Weekly Off: Sat | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sat',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '705';

-- Vikas Kumar Singh (Emp No: 706) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '706';

-- Ayman Rafeek Mulla (Emp No: 707) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '707';

-- Dheeraj U Paigankar (Emp No: 711) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '711';

-- Natasha Bhatia (Emp No: 712) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '712';

-- H G Lokeshwari (Emp No: 723) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '723';

-- Seijal Swamy (Emp No: 734) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '734';

-- Yash Gupta (Emp No: 86) - Weekly Off: Sun | Shift: 12:00:00 - 21:00:00 (12-9)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '12:00:00',
    shift_end = '21:00:00',
    updated_at = NOW()
WHERE employee_code = '86';

-- Komal Kumari (Emp No: 87) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '87';

-- Sabreena Jannath (Emp No: 9) - Weekly Off: Sun | Shift: 10:00:00 - 19:00:00 (10-7)
UPDATE hrms_employees
SET weekly_off = 'Sun',
    shift_start = '10:00:00',
    shift_end = '19:00:00',
    updated_at = NOW()
WHERE employee_code = '9';

-- ==========================================================================
-- SECTION 2: WEEKLY OFF ONLY - roster has OFF cells but no shift token (0 employees)
-- ==========================================================================

-- ==========================================================================
-- SECTION 3: SHIFT ONLY - roster has a shift but no OFF cells (0 employees)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- COMMIT
-- --------------------------------------------------------------------------
COMMIT;

-- ==========================================================================
-- UNTOUCHED: roster rows with no usable data (1)
-- ==========================================================================
/*
• [Emp No: 750] Gokulakrishnan J - Roster row has no shift and no OFF cells
*/

-- ==========================================================================
-- SKIPPED: in employees.csv but not in the roster (27)
-- ==========================================================================
/*
• [Emp No: 690] Ashwini Kumar Biswal (employees.csv shift: blank)
• [Emp No: 749] Somya Aditi (employees.csv shift: blank)
• [Emp No: 748] Dinky Sharma (employees.csv shift: blank)
• [Emp No: 746] Anjali Uniyal (employees.csv shift: blank)
• [Emp No: 745] Siya Sanjay Agrawal (employees.csv shift: blank)
• [Emp No: 744] Shejal Kakodiya (employees.csv shift: blank)
• [Emp No: 742] Divyaprabha K S (employees.csv shift: blank)
• [Emp No: 743] Meghna Biswas (employees.csv shift: blank)
• [Emp No: 741] Muskan Agarwal (employees.csv shift: blank)
• [Emp No: 737] Chaitali Suresh Shende (employees.csv shift: blank)
• [Emp No: 735] Himanshu Pawar (employees.csv shift: blank)
• [Emp No: 738] Pritam Shil (employees.csv shift: blank)
• [Emp No: 736] Rohit Kumar (employees.csv shift: blank)
• [Emp No: 731] Ankana Mukherjee (employees.csv shift: blank)
• [Emp No: 729] Sagar Govindaraj Betadur (employees.csv shift: blank)
• [Emp No: 728] Sanjana Manoj (employees.csv shift: blank)
• [Emp No: 725] Gungun (employees.csv shift: blank)
• [Emp No: 726] P PUNIT KUMAR (employees.csv shift: blank)
• [Emp No: 719] Mariyam Siddique (employees.csv shift: blank)
• [Emp No: 722] Priyo Dutta (employees.csv shift: blank)
• [Emp No: 713] Dhwani Vishnoi (employees.csv shift: blank)
• [Emp No: 709] Amala Melfa J (employees.csv shift: blank)
• [Emp No: 708] Nilesh Pattanayak (employees.csv shift: blank)
• [Emp No: 338] Puja Sharma (employees.csv shift: blank)
• [Emp No: 113] Jayaprabha V (employees.csv shift: blank)
• [Emp No: 576] Aditi Yadav (employees.csv shift: blank)
• [Emp No: 66] Rajasree Das (employees.csv shift: blank)
*/

-- Verification:
-- SELECT employee_code, full_name, shift_start, shift_end, weekly_off, updated_at
-- FROM hrms_employees WHERE employee_code IN ('10','109','123','138','142', ...);
-- SELECT weekly_off, COUNT(*) FROM hrms_employees GROUP BY weekly_off;
