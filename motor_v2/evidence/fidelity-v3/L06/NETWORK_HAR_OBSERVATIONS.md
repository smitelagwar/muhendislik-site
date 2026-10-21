# L06 — Network and HAR observations

Network evidence is separate from `REA_STATIC_ANALYSIS.md`.

## What the supplied screenshots show

- The Vercel request-log screenshot shows a `POST /api/dokumantasyon/cad-v2/prepare` with status `200` at the displayed time `OCT 17 17:02:30.68` and repeated `GET /api/dokumantasyon/cad-v2/scenes/...` requests with status `404` around the displayed `17:02:28–17:02:43` interval. The request path is visually truncated in the screenshot.
- The viewer screenshot reports the missing object `chunk_model_004` with `404`.
- The images do not expose a shared request/scene/object correlation key, a complete response body/path, storage mode, build ID, deployment ID, or source SHA.

## HAR status and conclusion

No HAR was supplied or found in the candidate repository, `cad-engine-references` analysis tree, or this L06 run. The supplied images remain incident clues, not a replayable HAR. No network request is inferred from REA's static graph. Dynamic fetch order, same-ID retries, response payloads, and production source/deployment correlation are `NOT_RUN` / `OPEN`.

To close the production correlation gate, provide a sanitized HAR from the failing opening plus its Vercel deployment ID or exact source commit/artifact digest. Remove cookies, authorization headers, share tokens, and private drawing contents before export.
