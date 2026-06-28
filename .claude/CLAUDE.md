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
