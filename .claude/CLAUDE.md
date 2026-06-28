# Global Instructions (all projects on this machine)

## Recipe: scaffold a Spring Boot backend (reusable across projects)

**Trigger:** when I ask to *add / spin up / generate / scaffold a Spring Boot backend* for any
project (e.g. "add a backend to this React app", "give this a Java API"), follow this recipe.
It is the author's preferred, proven shape. Adapt the base package to the new project; everything
else is the template.

**Preferred path — use the skill:** there is a `scaffold-spring-backend` skill at
`C:\Users\bobby\.claude\skills\scaffold-spring-backend\` whose `template/` is a runnable, minimal
backend (register/login/JWT/profile + the full JDBC aggregate pattern) in exactly this shape.
Invoke that skill and follow its `SKILL.md` (copy `template/`, rename `com.example.backend`, set
`.env`, run `schema.sql`, build). The recipe below is the same blueprint in prose for when the
skill isn't loaded.

**Reference implementation (canonical worked example on this machine):**
`B:\Documents\Coding\angularSpringBootFullStack\angularSpringBootFullStack` — crib exact code from
its `src/main/java/com/bob/angularspringbootfullstack/**`, `pom.xml`, `src/main/resources/*.yml`,
`schema.sql`, and `documentation/backend-blueprint.md`. Copy the patterns, not the package name.

### Stack baseline
- **Spring Boot (latest; currently 4.0.x)**, **Java 21**, **Maven**, **Lombok** (annotation processor,
  excluded from the boot jar). Always use the latest Spring/Java; modernize legacy patterns.
- Starters: `web`/`webmvc`, `security`, `validation`, **`data-jdbc`** (core domain), `oauth2-client`
  (only if federated login is wanted), `mail` (only if email flows), `actuator`. DB driver as runtime
  scope (`mysql-connector-j` by default; Postgres if asked). JWT via `jjwt` + `auth0 java-jwt`.
- Maven profiles `dev` (default) / `prod` / etc., each setting `spring.profiles.active`.

### Package layout (one package per responsibility, under the project's base package)
`controller/` (thin `@RestController`s) → `service/` + `service/serviceimpl/` →
`repo/` + `repo/repoimpl/`, supported by `query/` (SQL constants), `rowmapper/`, `model/`,
`dto/` + `dtomapper/`, `form/` (request bodies), `enumeration/`, `event/` + `listener/`,
`exception/` (`ApiException` + `@RestControllerAdvice` global handler), `handler/` (401/403/OAuth2),
`filter/` (`CustomAuthFilter`), `configuration/` (`SecurityConfig` etc.), `tokenprovider/`,
`utils/`, `constants/`, `seed/`.

### Data access — JDBC, NOT JPA, for the core domain (the signature pattern)
Per aggregate, four cooperating pieces wired with **`NamedParameterJdbcTemplate`**:
1. `XQuery` — `public static final String` SQL constants, **named** params (`:email`), documented.
2. `XRowMapper` — `ResultSet` → model via Lombok builder.
3. `XRepo` (interface) — CRUD contract.
4. `XRepoImpl` (`@Repository`, `@RequiredArgsConstructor`) — `MapSqlParameterSource` to bind,
   `GeneratedKeyHolder` for inserts, `EmptyResultDataAccessException` = not-found, static-import the
   query constants. The user repo also implements `UserDetailsService.loadUserByUsername`.
- Schema owned by an **idempotent `src/main/resources/schema.sql`** (`CREATE TABLE IF NOT EXISTS`,
  no DROPs, `spring.sql.init.mode: never` — run by hand). **Do NOT add Flyway/Liquibase** (the author
  removed it on purpose). If any JPA entities are used, add explicit `@Column` on every field
  (`globally_quoted_identifiers: true` bypasses the snake_case strategy).

### Security — stateless JWT, permission-based
- `@EnableWebSecurity @EnableMethodSecurity`; `SessionCreationPolicy.STATELESS`; CSRF + httpBasic off;
  CORS bean whitelisting the SPA origin and exposing `Authorization` / `Jwt-Token`.
- `AuthenticationManager` = `ProviderManager(DaoAuthenticationProvider)` + `BCryptPasswordEncoder`
  (strength 12) + the `UserDetailsService`.
- `CustomAuthFilter` registered `addFilterBefore(... UsernamePasswordAuthenticationFilter)`: parses the
  Bearer JWT each request, sets a `UserDTO` principal (read via `@AuthenticationPrincipal UserDTO`).
- Authorization via **authority strings** (e.g. `READ:USER`, `UPDATE:CUSTOMER`, `DELETE:USER`,
  `UPDATE:ROLE`) split off the user's Role; request matchers are top-down so specific rules precede the
  broad `/**` catch-alls.
- Custom **401** entry point + **403** access-denied handlers.
- Keep two public-route lists in lockstep: the filter chain's `permitAll` set and the
  `CustomAuthFilter`'s `startsWith` skip list — a route public in one but not the other breaks on a
  stale `Authorization` header.

### Conventions to apply
- Every endpoint returns `ResponseEntity<HttpResponse>` — a standard envelope
  (`timeStamp`, `statusCode`, `status`, `message`, `Map data`, …), usually embedding the authenticated
  user alongside the payload.
- Config from **environment variables** (`.env.example` + dev fallbacks); never hardcode secrets.
- Full multi-line Javadoc that explains how a class relates to the rest of the codebase.
- Never reveal whether an email/identifier exists via error messages (user-enumeration risk).

### Do better than the reference (gaps to NOT copy)
Add real tests (the reference has near-zero); put `@Valid` on every request body; keep business logic
(password encoding, UUID/code generation, validation) in the **service** layer, not the repo; treat any
SMS/2FA as a real integration, not a stub.

---

## Documentation Standards (all projects)

**Apply these to every new repo created and existing repos when asked to work in them.**

### When to Create Documentation

Trigger immediately when:
- Starting a new project/repo
- Adding a significant feature or module
- Refactoring large sections
- Before shipping to production
- When onboarding new people

### Required Documentation Files

Every repository MUST have these documentation files in `docs/` or root:

#### 1. **SRS.md** (Software Requirements Specification)
**Purpose:** Define what the system does and why

**Location:** `docs/SRS.md` or `SRS.md`

**Contents:**
```
# Software Requirements Specification

## 1. Executive Summary
- Project name and version
- Purpose and goals (1-3 sentences)
- Key stakeholders

## 2. System Overview
- What problem does it solve?
- Who are the users?
- What are the main features?

## 3. Functional Requirements
- Feature A: what it does, how to use it
- Feature B: ...
- Feature C: ...

## 4. Non-Functional Requirements
- Performance (e.g., response time < 200ms)
- Security (e.g., HTTPS, auth required)
- Scalability (e.g., support 10k concurrent users)
- Reliability (e.g., 99.9% uptime)

## 5. User Stories (if applicable)
- As a [user], I want to [action] so that [benefit]
- Examples: "As a user, I want to search lessons by topic so that I can learn faster"

## 6. Success Criteria
- How do we know it's successful?
- What metrics matter?

## 7. Constraints
- Technical constraints
- Timeline constraints
- Resource constraints
```

#### 2. **ARCHITECTURE.md** (System Design)
**Purpose:** Explain the technical structure and design decisions

**Location:** `docs/ARCHITECTURE.md`

**Contents:**
```
# Architecture Documentation

## 1. System Architecture
- Diagram or description of major components
- How do they interact?
- Data flow

## 2. Technology Stack
- Frontend: Angular, React, Vue, etc.
- Backend: Node, Spring, Python, etc.
- Database: SQL, NoSQL, etc.
- Infrastructure: Docker, Kubernetes, etc.

## 3. Directory Structure
```
src/
├── app/              # Frontend components
├── api/              # API routes
├── services/         # Business logic
├── models/           # Data models
├── utils/            # Helpers
└── tests/            # Test files
```

## 4. Key Design Patterns
- What patterns are used? (MVC, pub-sub, service layer, etc.)
- Why were they chosen?

## 5. Data Models
- Entity relationships
- Key entities and their properties
- Any special considerations

## 6. API Endpoints (if backend)
- List major endpoints
- Request/response format
- Authentication required?

## 7. Scalability Considerations
- How does it scale?
- What are potential bottlenecks?

## 8. Security Considerations
- How is data protected?
- Authentication/authorization approach
- What are security risks and mitigations?
```

#### 3. **UI-DESIGN.md** (User Interface Design)
**Purpose:** Document UI/UX decisions and design system

**Location:** `docs/UI-DESIGN.md`

**Contents:**
```
# UI/UX Design Documentation

## 1. Design System
- Color palette (primary, secondary, accent)
- Typography (fonts, sizes, weights)
- Spacing (margins, padding, gaps)
- Icons and imagery style

## 2. Component Library
- Available reusable components
- Example: Button, Card, Modal, etc.
- Where are they defined?

## 3. Layout Patterns
- Page layout structure
- Responsive breakpoints (mobile, tablet, desktop)
- Navigation structure

## 4. User Flows
- Main user journey diagrams
- Key workflows (sign up, search, purchase, etc.)

## 5. Accessibility (A11y)
- WCAG compliance level (A, AA, AAA)
- Keyboard navigation supported?
- Screen reader friendly?
- Color contrast ratios

## 6. Styling Conventions
- CSS/SCSS conventions used
- Naming patterns
- Component styling approach

## 7. Screenshot/Mockup References
- Links to Figma, Adobe XD, or design tool
- Current state of designs
```

#### 4. **DEPLOYMENT.md** (How to Deploy)
**Purpose:** Instructions for deploying to production

**Location:** `docs/DEPLOYMENT.md` or `DEPLOYMENT.md`

**Include:** Environment setup, CI/CD pipelines, deployment steps, rollback procedures

---

### How to Format Documentation

**Use this template for any documentation file:**

```markdown
# [Document Title]

**Version:** 1.0  
**Last Updated:** [Date]  
**Author:** [Your Name]  
**Status:** [Draft | Review | Final]

## Overview
Brief description (2-3 sentences)

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1
Content here...

### Subsection
More details...

## Section 2
Content here...

## Related Documents
- [Link to other docs]
- [Reference materials]
```

---

### Documentation Best Practices

1. **Keep it updated** - Docs rot if not maintained. Update when code changes.
2. **Use examples** - Show, don't just tell. Code snippets help.
3. **Include diagrams** - ASCII diagrams or links to real ones (Mermaid, Lucidchart, etc.)
4. **Be specific** - "Handle errors" → "Catch network errors and show user a toast notification with retry button"
5. **Link related docs** - Cross-reference SRS, ARCHITECTURE, and UI-DESIGN
6. **Include dates** - When was this written? Is it still accurate?
7. **Version it** - If it changes significantly, bump the version number

---

### Quick Reference: What Goes Where

| Question | Document |
|----------|----------|
| What is the system supposed to do? | SRS.md |
| How is it technically built? | ARCHITECTURE.md |
| How does the UI look and work? | UI-DESIGN.md |
| How do I deploy it? | DEPLOYMENT.md |
| Why did you choose X over Y? | ARCHITECTURE.md |
| Who are the users? | SRS.md |
| What's the color palette? | UI-DESIGN.md |
| How do I run tests? | README.md or DEVELOPMENT.md |

---

### Checklist for New Projects

When creating a new repo, before any code:
- [ ] Create `SRS.md` - Define requirements
- [ ] Create `ARCHITECTURE.md` - Plan the design
- [ ] Create `UI-DESIGN.md` - Plan the interface (if frontend)
- [ ] Create `DEPLOYMENT.md` - Plan deployment
- [ ] Create `README.md` - Quick start guide

When working in existing repos:
- [ ] Check if docs exist
- [ ] Update/enhance if incomplete
- [ ] Ensure docs match current code
- [ ] Flag any outdated information
