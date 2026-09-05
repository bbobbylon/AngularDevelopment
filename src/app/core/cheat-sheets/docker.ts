import type { CheatSheet } from './cheat-sheet.model';

/** Docker — build, run, and compose a container. */
export const DOCKER_SHEET: CheatSheet = {
  id: 'docker',
  title: 'Docker',
  icon: '🐳',
  tagline: 'Zero to a running container, from build to compose.',
  category: 'deployment',
  intro:
    'Docker packages an app with everything it needs to run into one portable image. This sheet ' +
    'covers the build/run loop for a single container, the flags worth knowing, and docker-compose ' +
    'for running more than one container together.',
  sections: [
    {
      title: 'Install & verify',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            { code: 'docker --version', note: 'Confirms Docker is installed.' },
            {
              code: 'docker run hello-world',
              note: 'Pulls a tiny test image and runs it — the "it works" check.',
            },
          ],
        },
      ],
    },
    {
      title: 'A minimal Dockerfile',
      blocks: [
        {
          kind: 'code',
          title: 'Dockerfile',
          lang: 'bash',
          code: `FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
          note:
            'COPY package*.json + "npm ci" before COPY . . is deliberate: Docker caches each layer, so ' +
            'dependencies only get reinstalled when package.json actually changes, not on every source edit.',
        },
      ],
    },
    {
      title: 'Daily commands',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'docker build -t my-app .',
              note: 'Builds an image from the Dockerfile in the current directory, tagged "my-app".',
            },
            {
              code: 'docker run -p 8080:3000 my-app',
              note: "Runs it, mapping host port 8080 to the container's port 3000.",
            },
            {
              code: 'docker run -d --rm --name my-app -p 8080:3000 my-app',
              note: 'Same, but detached (-d), auto-removed on stop (--rm), and named for easy reference.',
            },
            { code: 'docker ps', note: 'Lists running containers.' },
            { code: 'docker ps -a', note: 'Lists every container, including stopped ones.' },
            {
              code: 'docker logs -f my-app',
              note: 'Streams a running container\'s output — the first thing to check when it "isn\'t working".',
            },
            {
              code: 'docker exec -it my-app sh',
              note: 'Opens a shell inside a running container, for poking around.',
            },
            { code: 'docker stop my-app', note: 'Stops a running container by name or ID.' },
            {
              code: 'docker system prune',
              note: 'Cleans up stopped containers, unused networks, and dangling images.',
            },
          ],
        },
        {
          kind: 'tip',
          tone: 'gotcha',
          text:
            'A `docker run` without "--rm" leaves the stopped container sitting around — check ' +
            '"docker ps -a" if disk usage is climbing for no obvious reason.',
        },
      ],
    },
    {
      title: 'Running more than one container',
      blocks: [
        {
          kind: 'code',
          title: 'docker-compose.yml',
          lang: 'yaml',
          code: `services:
  app:
    build: .
    ports:
      - "8080:3000"
    environment:
      DATABASE_URL: mysql://db:3306/app
    depends_on:
      - db
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: devpassword
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:`,
          note:
            '"depends_on" only waits for the other container to start, not for it to actually be ready ' +
            '(MySQL can take a few seconds after start before it accepts connections) — an app that ' +
            'connects on boot needs its own retry logic, not just this key.',
        },
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'docker compose up',
              note: 'Builds (if needed) and starts every service defined in docker-compose.yml.',
            },
            { code: 'docker compose up -d', note: 'Same, detached.' },
            {
              code: 'docker compose down',
              note: 'Stops and removes the containers (add "-v" to also drop named volumes).',
            },
            {
              code: 'docker compose logs -f app',
              note: 'Streams logs for just the "app" service.',
            },
          ],
        },
      ],
    },
    {
      title: 'Common `docker run` flags',
      blocks: [
        {
          kind: 'table',
          headers: ['Flag', 'Meaning'],
          rows: [
            ['-d', 'Detached — run in the background.'],
            ['-p host:container', 'Publish a port from the container to the host.'],
            ['-v host:container', 'Mount a host path (or named volume) into the container.'],
            ['-e KEY=value', 'Set an environment variable.'],
            ['--rm', 'Remove the container automatically when it stops.'],
            ['--name', 'Give the container a fixed, human-readable name.'],
            ['-it', 'Interactive + a pseudo-TTY — needed for an attached shell session.'],
          ],
        },
      ],
    },
  ],
};
