# 📍 Ella Rises — Route Map

Below is a complete map of all backend routes for the Ella Rises INTEX application.
These routes support all required CRUD functionality across:

 * Participants
 * Events (Templates)
 * Event Occurrences
 * Registrations
 * Surveys
 * Milestones
 * Donations
 * Authentication
 * Landing Page

---

## 🔐 Authentication Routes

| Method | Path           | Description               |
| ------ | -------------- | ------------------------- |
| GET    | `/auth/login`  | Show login form           |
| POST   | `/auth/login`  | Authenticate user         |
| GET    | `/auth/logout` | Log out and clear session |

## 🏠 Home / Public Landing Page

| Method | Path | Description                             |
| ------ | ---- | --------------------------------------- |
| GET    | `/`  | Public homepage (mission + donate link) |

## 👤 Participants Routes

| Method | Path                       | Description                           |
| ------ | -------------------------- | ------------------------------------- |
| GET    | `/participants`            | List all participants                 |
| GET    | `/participants/new`        | New participant form *(manager only)* |
| POST   | `/participants/new`        | Create new participant                |
| GET    | `/participants/:id/edit`   | Edit participant *(manager only)*     |
| POST   | `/participants/:id/edit`   | Update participant                    |
| POST   | `/participants/:id/delete` | Delete participant                    |
| GET    | `/participants/:id`        | View participant details              |

## 🌱 Milestones Routes

| Method | Path                     | Description                         |
| ------ | ------------------------ | ----------------------------------- |
| GET    | `/milestones`            | List all milestones                 |
| GET    | `/milestones/new`        | New milestone form *(manager only)* |
| POST   | `/milestones/new`        | Create milestone                    |
| GET    | `/milestones/:id/edit`   | Edit milestone *(manager only)*     |
| POST   | `/milestones/:id/edit`   | Update milestone                    |
| POST   | `/milestones/:id/delete` | Delete milestone                    |
| GET    | `/milestones/:id`        | View milestone details              |

## 🎪 Event Template Routes

| Method | Path                 | Description                              |
| ------ | -------------------- | ---------------------------------------- |
| GET    | `/events`            | List all event templates                 |
| GET    | `/events/new`        | New event template form *(manager only)* |
| POST   | `/events/new`        | Create event template                    |
| GET    | `/events/:id/edit`   | Edit event template *(manager only)*     |
| POST   | `/events/:id/edit`   | Update event template                    |
| POST   | `/events/:id/delete` | Delete event template                    |
| GET    | `/events/:id`        | View template details                    |

## 📅 Event Occurrence Routes

| Method | Path                           | Description                          |
| ------ | ------------------------------ | ------------------------------------ |
| GET    | `/eventOccurrences`            | List all event occurrences           |
| GET    | `/eventOccurrences/new`        | New occurrence form *(manager only)* |
| POST   | `/eventOccurrences/new`        | Create event occurrence              |
| GET    | `/eventOccurrences/:id/edit`   | Edit occurrence *(manager only)*     |
| POST   | `/eventOccurrences/:id/edit`   | Update occurrence                    |
| POST   | `/eventOccurrences/:id/delete` | Delete occurrence                    |
| GET    | `/eventOccurrences/:id`        | View occurrence details              |

## 📝 Registration Routes
(Composite Key: EventOccurrenceID + ParticipantID)

| Method | Path                                   | Description                            |
| ------ | -------------------------------------- | -------------------------------------- |
| GET    | `/registrations`                       | List all registrations                 |
| GET    | `/registrations/new`                   | New registration form *(manager only)* |
| POST   | `/registrations/new`                   | Create registration                    |
| GET    | `/registrations/:occID/:partID/edit`   | Edit registration *(manager only)*     |
| POST   | `/registrations/:occID/:partID/edit`   | Update registration                    |
| POST   | `/registrations/:occID/:partID/delete` | Delete registration                    |
| GET    | `/registrations/:occID/:partID`        | View registration                      |

## ⭐ Survey Routes
(Composite Key: EventOccurrenceID + ParticipantID)

| Method | Path                             | Description                      |
| ------ | -------------------------------- | -------------------------------- |
| GET    | `/surveys`                       | List all surveys                 |
| GET    | `/surveys/new`                   | New survey form *(manager only)* |
| POST   | `/surveys/new`                   | Create survey                    |
| GET    | `/surveys/:occID/:partID/edit`   | Edit survey *(manager only)*     |
| POST   | `/surveys/:occID/:partID/edit`   | Update survey                    |
| POST   | `/surveys/:occID/:partID/delete` | Delete survey                    |
| GET    | `/surveys/:occID/:partID`        | View survey                      |

## 💸 Donations Routes
### Public-facing donation pages
| Method | Path                | Description          |
| ------ | ------------------- | -------------------- |
| GET    | `/donations/new`    | Public donation form |
| POST   | `/donations/new`    | Submit donation      |
| GET    | `/donations/thanks` | Thank-you page       |

### Internal donation management (login required)
| Method | Path                    | Description                    |
| ------ | ----------------------- | ------------------------------ |
| GET    | `/donations`            | List all donations             |
| GET    | `/donations/:id`        | View donation                  |
| GET    | `/donations/:id/edit`   | Edit donation *(manager only)* |
| POST   | `/donations/:id/edit`   | Update donation                |
| POST   | `/donations/:id/delete` | Delete donation                |
