import type { CheatSheet } from './cheat-sheet.model';

/** AWS CLI — configure, then the S3/CloudFront commands a static-site deploy actually uses. */
export const AWS_CLI_SHEET: CheatSheet = {
  id: 'aws-cli',
  title: 'AWS CLI',
  icon: '☁️',
  tagline: 'Zero to a deployed static site, from configure to a CloudFront invalidation.',
  category: 'cloud',
  intro:
    'The `aws` CLI wraps every AWS service behind one tool. This sheet does not try to cover all ' +
    'of AWS — it covers the slice a small app actually touches: configuring credentials, and the ' +
    'S3 + CloudFront commands a static-site deploy runs.',
  sections: [
    {
      title: 'Install & configure',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            { code: 'aws --version', note: 'Confirms the CLI is installed and which version.' },
            {
              code: 'aws configure',
              note: 'Prompts for access key, secret key, default region, and output format — writes them to ~/.aws/credentials.',
            },
            {
              code: 'aws sts get-caller-identity',
              note: 'Confirms which account/user the CLI is currently authenticated as — the first thing to check when a command mysteriously fails.',
            },
          ],
        },
      ],
    },
    {
      title: 'S3 — the bucket',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            { code: 'aws s3 ls', note: 'Lists every bucket in the account.' },
            {
              code: 'aws s3api create-bucket --bucket my-app --region us-east-1',
              note: 'Creates a new bucket. Bucket names are globally unique across all of AWS.',
            },
            {
              code: 'aws s3 sync ./dist s3://my-app --delete',
              note: 'Uploads a local build folder, and removes anything in the bucket that no longer exists locally.',
            },
            {
              code: 'aws s3 ls s3://my-app',
              note: 'Lists what is actually in the bucket right now.',
            },
          ],
        },
        {
          kind: 'tip',
          tone: 'gotcha',
          text:
            '"--delete" on `aws s3 sync` is what keeps the bucket matching your dist folder exactly — ' +
            'without it, files removed from the build linger in the bucket forever.',
        },
      ],
    },
    {
      title: 'CloudFront — the CDN in front of it',
      blocks: [
        {
          kind: 'commands',
          lang: 'bash',
          rows: [
            {
              code: 'aws cloudfront list-distributions',
              note: 'Lists distributions and their IDs — you need the ID for the next command.',
            },
            {
              code: 'aws cloudfront create-invalidation --distribution-id E1AB2C3D4E --paths "/*"',
              note: 'Forces CloudFront to re-fetch from S3 instead of serving its cached copy.',
            },
          ],
        },
        {
          kind: 'tip',
          tone: 'warn',
          text:
            'A CloudFront edge cache does not know your S3 files changed just because you re-ran `s3 sync`. ' +
            'Without an invalidation (or waiting out the cache TTL), visitors keep seeing the old build.',
        },
      ],
    },
    {
      title: 'Common service prefixes',
      blocks: [
        {
          kind: 'table',
          headers: ['Prefix', 'Service'],
          rows: [
            ['aws s3 / aws s3api', 'Object storage — buckets and files.'],
            ['aws cloudfront', 'CDN distributions in front of S3 or any origin.'],
            ['aws iam', 'Users, roles, and permission policies.'],
            ['aws ec2', 'Virtual machines and their networking.'],
            ['aws lambda', 'Serverless functions.'],
            ['aws rds', 'Managed relational databases.'],
          ],
        },
      ],
    },
  ],
};
