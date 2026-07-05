# CompetencyX Frontend Integration Notes

## Overview

This document summarizes the current assessment API contract after the role-discovery refactor.

- Backend base URL for local development: `http://localhost:8000`
- Live schema endpoint: `GET /api/schema/`
- Swagger UI: `GET /api/schema/swagger-ui/`
- Checked-in schema snapshot: [docs/openapi.json](/D:/Flook/SE/Personal%20Project/CompentencyX/docs/openapi.json)
- Authentication: none currently required

The backend remains the source of truth for:

- question selection
- role-discovery progression
- role ambiguity and resolution state
- final recommendation output

## Main Contract Changes

### Lean session payloads

`POST /api/assessment-sessions/`, `GET /api/assessment-sessions/{id}/`, and `POST /api/assessment-sessions/{id}/answers/` now return a lean session-state payload.

Fields included:

- `id`
- `status`
- `phase`
- `best_fit_confidence`
- `preferred_role`
- `best_fit_role`
- `profile`
- `started_at`
- `updated_at`
- `completed_at`
- `milestones`
- `role_alignment_status`
- `role_resolution_status`
- `guidance_summary`
- `current_question`

Fields removed from the in-progress session payload:

- `top_role_candidates`
- `mastery_scores`
- recommendation objects
- detailed pillar analysis

### Public question shape

`current_question` still contains:

- `id`
- `code`
- `stage`
- `question_type`
- `prompt`
- `help_text`
- `role`
- `topic`
- `difficulty`
- `options`

`discrimination_score` is no longer exposed in the public question payload.

### New insights endpoint

`GET /api/assessment-sessions/{id}/insights/` was added for explainability-oriented UI or analytics views.

Response fields:

- `role_resolution_status`
- `best_fit_role`
- `best_fit_confidence`
- `answered_role_questions`
- `pillar_profile`
- `ranked_roles`
- `guidance_summary`

`pillar_profile` items contain:

- `key`
- `label`
- `raw_score`
- `normalized_score`
- `evidence_count`

`ranked_roles` items contain:

- `slug`
- `name`
- `fit_score`
- `fit_share`
- `top_supporting_pillars`

### Final results payload

`GET /api/assessment-sessions/{id}/results/` still returns recommendation data, and now also includes:

- `pillar_profile`
- `ranked_roles`
- `role_resolution_status`

This means detailed role-fit analysis is available from:

- `/api/assessment-sessions/{id}/insights/`
- `/api/assessment-sessions/{id}/results/`

## Current Assessment Endpoints

| Method | Path                                      | Notes                                                                 |
| ------ | ----------------------------------------- | --------------------------------------------------------------------- |
| `POST` | `/api/assessment-sessions/`               | Creates a session and returns lean session state                      |
| `GET`  | `/api/assessment-sessions/{id}/`          | Returns lean session state for recovery or refresh                    |
| `POST` | `/api/assessment-sessions/{id}/answers/`  | Submits the current answer and returns the updated lean session state |
| `GET`  | `/api/assessment-sessions/{id}/insights/` | Returns pillar profile and ranked-role analysis                       |
| `GET`  | `/api/assessment-sessions/{id}/results/`  | Returns final recommendations, mastery, and analysis after completion |
| `GET`  | `/api/assessment-sessions/{id}/history/`  | Returns answer and recommendation history after completion            |

## Role Discovery Notes

Role discovery is now based on a larger, pillar-driven question bank and may resolve early if confidence becomes strong enough.

Relevant session fields:

- `phase`: `role_discovery`, `role_ambiguity`, or `recommendation_ready`
- `role_resolution_status`: `unknown`, `in_progress`, `resolved`, or `ambiguous`
- `role_alignment_status`: `unknown`, `aligned`, `mismatch`, or `ambiguous`

Important implications:

- `best_fit_role` can change during role discovery
- `current_question` can become `null` in `role_ambiguity`
- a session with a `preferred_role` can still proceed into skill assessment even if role resolution is not fully resolved

## OpenAPI Spec

The checked-in OpenAPI snapshot should be used as the frontend reference artifact for:

- generated types
- generated clients
- contract review

Source of truth:

- live endpoint: `GET /api/schema/`
- checked-in snapshot: [docs/openapi.json](/D:/Flook/SE/Personal%20Project/CompentencyX/docs/openapi.json)

Schema refresh command:

```bash
uv run python manage.py spectacular --format openapi-json --file docs/openapi.json
```

If frontend code relies on generated types or generated clients, regenerate them after backend serializer, schema, or route changes.
