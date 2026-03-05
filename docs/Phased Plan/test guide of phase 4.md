1. Start the server and DB

docker-compose up -d # PostgreSQL
npm run dev # Dev server

2. Get a teacher token

# Login as a teacher (adjust credentials to match your seed data)

curl -X POST http://localhost:3000/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{"emailOrUsername": "teacher@example.com", "password": "your_password"}'

Save the accessToken from the response.

3. Walk through the pipeline

TOKEN="your_token_here"

# FR-4.1: Upload a markdown file

curl -X POST http://localhost:3000/api/courses/upload \
 -H "Authorization: Bearer $TOKEN" \
 -F "title=My Test Course" \
 -F "file=@path/to/course.md"

# FR-4.4: Generate AI structure (replace DRAFT_ID)

curl -X POST http://localhost:3000/api/courses/DRAFT_ID/generate \
 -H "Authorization: Bearer $TOKEN"

# FR-4.5: List your drafts

curl http://localhost:3000/api/courses/drafts \
 -H "Authorization: Bearer $TOKEN"

# FR-4.6: Edit the generated JSON

curl -X PUT http://localhost:3000/api/courses/DRAFT_ID \
 -H "Authorization: Bearer $TOKEN" \
 -H "Content-Type: application/json" \
 -d '{"edited_json": { "title": "Edited Title", "theme": {...}, "concepts": [...] }}'

# FR-4.7: Publish

curl -X POST http://localhost:3000/api/courses/DRAFT_ID/publish \
 -H "Authorization: Bearer $TOKEN"

# FR-4.8: Verify module appears in overview

curl http://localhost:3000/api/modules/overview \
 -H "Authorization: Bearer $TOKEN"

Important caveat

The generate step (FR-4.4) calls your AI provider's generateStructure() method. In tests this is mocked. In production you'll need either:

- OPENAI_API_KEY or ANTHROPIC_API_KEY set in .env
- The generateStructure method implemented in OpenAIProvider / AnthropicProvider (currently only the interface is defined — the real providers don't
  implement it yet)

So for now, manual testing works up through upload and list drafts. The generate→publish flow works end-to-end only in the automated tests (where the AI is
mocked). To test the full flow manually, you'd need to either:

1. Implement generateStructure in one of the AI providers, or
2. Skip generate — manually PUT valid JSON into edited_json, then set the draft status to REVIEW in the DB, then publis
