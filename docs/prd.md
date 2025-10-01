# Product Requirements Document (PRD)

**Project:** True Competency  
**Audience:** Medical educators (doctors) and students  
**Date:** September 2025  
**Author:** Murad Novruzov

---

## 1. Problem Statement

Medical students and their supervising doctors often struggle to stay aligned on training goals. Competencies may be defined, but tracking progress (per-student, per-topic) is fragmented, manual, or lost in spreadsheets. There’s no lightweight, structured tool that lets doctors assign competencies and track progress while students complete them with clarity.

---

## 2. Goal

Provide a **shared competency tracking platform** where:

- **Students** clearly see their assigned competencies, answer related test questions, and monitor progress via progress bars.
- **Doctors** oversee their students’ progress, assign competencies, and identify gaps quickly.
- Data is structured (not trapped in CSVs) but remains easy to update from standardized competency lists.

---

## 3. Success Metrics

**MVP Success (3–6 months):**

- [ ] Doctors can add a student, assign competencies, and view % progress.
- [ ] Students can log in, see their assignments, and answer questions.
- [ ] CSV → DB merge works reliably for updating competencies.
- [ ] 1–2 real student/doctor pairs can run their training entirely inside the system without spreadsheets.

**v1.0 Success (12–18 months):**

- [ ] > 80% of competencies in the training program are actively tracked in the system.
- [ ] Doctors can generate simple reports (overall student performance, per-competency difficulty trends).
- [ ] Students rate clarity and usability of the platform ≥4/5 in feedback.
- [ ] System can handle 50–100 active users with no performance issues.

---

## 4. Users & Roles

- **Student**
  - Sees assigned competencies.
  - Answers test questions.
  - Tracks progress (per-competency and overall).
- **Doctor**
  - Manages their students (assign/remove competencies).
  - Creates/edits test questions.
  - Views student dashboards + overall progress.
- **Admin (optional for later)**
  - Seeds new competency data.
  - Oversees all users, roles, and resets.

---

## 5. MVP Feature Set

### Must-Haves

- Authentication via Supabase (email/password).
- Profiles table with `role` (student/doctor).
- Competencies table + CSV merge workflow.
- Student dashboard:
  - Assigned competencies listed.
  - Progress bars (answered / total questions).
- Doctor dashboard:
  - Student list with overall progress.
  - Per-student page with competency breakdown.
  - Assign/unassign competencies.
- Basic test question answering.
- Debug page (`/debug`) to verify Supabase connection & policies.

### Nice-to-Haves (if time allows in MVP)

- Search/filter by difficulty or tags.
- Light/dark theme toggle.
- Question feedback (“correct/incorrect” with retry).

---

## 6. v1.0 Feature Set (Post-MVP)

- Full CRUD for competencies and questions from the UI (no need to import CSVs).
- Reporting/export for doctors (PDF/CSV of student progress).
- Notifications (email or in-app) when a student completes a competency.
- Role-based access control with RLS hardened in production.
- Multi-doctor to single-student support (e.g., team supervision).
- Analytics for admins (which competencies are most/least passed).

---

## 7. Technical Notes

- **Stack:** Next.js (App Router) + Supabase (Postgres, Auth, RLS) + Vercel.
- **Database:**
  - `profiles`, `competencies`, `competency_assignments`, `competency_questions`, `student_answers`, `doctor_students`.
  - Views: `student_competency_progress`, `student_overall_progress`.
- **Hosting:** Vercel (frontend), Supabase (backend).
- **Security:** RLS to enforce doctor/student boundaries; service-role key used only for merge.
- **Scalability:** indexes on lower(name), tags GIN, composite PKs.

---

## 8. Risks & Mitigation

- **Risk:** Doctors resist switching from Excel.
  - Mitigation: keep CSV merge simple so data can move both ways.
- **Risk:** Incomplete assignments lead to “empty dashboards.”
  - Mitigation: allow fallback display of competency IDs.
- **Risk:** Students forget passwords.
  - Mitigation: enable Supabase magic links or reset flow.

---

## 9. Timeline (MVP)

- **Week 1–2:** Finalize schema + RLS policies (dev only).
- **Week 3–4:** Implement student dashboard + progress view.
- **Week 5–6:** Implement doctor dashboard + assignment flow.
- **Week 7:** Question answering flow.
- **Week 8:** QA, bug fixes, seed real competencies, small pilot with 1–2 users.
