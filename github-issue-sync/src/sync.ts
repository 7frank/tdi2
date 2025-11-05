import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { LocalIssue, GitHubIssue, SyncResult } from './types';

// Load environment variables
config();

class GitHubIssueSync {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private issuesFile: string;

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }

    this.octokit = new Octokit({ auth: token });
    this.owner = process.env.GITHUB_OWNER || '7frank';
    this.repo = process.env.GITHUB_REPO || '';
    this.issuesFile = process.env.ISSUES_FILE || './issues.json';

    if (!this.repo) {
      throw new Error('GITHUB_REPO environment variable is required');
    }
  }

  private async loadLocalIssues(): Promise<LocalIssue[]> {
    if (!fs.existsSync(this.issuesFile)) {
      console.log('Local issues file not found, creating empty array');
      return [];
    }

    try {
      const content = fs.readFileSync(this.issuesFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error reading local issues file:', error);
      return [];
    }
  }

  private saveLocalIssues(issues: LocalIssue[]): void {
    try {
      const dir = path.dirname(this.issuesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.issuesFile, JSON.stringify(issues, null, 2));
      console.log(`Saved ${issues.length} issues to ${this.issuesFile}`);
    } catch (error) {
      console.error('Error saving local issues file:', error);
      throw error;
    }
  }

  private async getGitHubIssues(): Promise<GitHubIssue[]> {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
        per_page: 100
      });

      return response.data.filter(issue => !issue.pull_request) as GitHubIssue[];
    } catch (error) {
      console.error('Error fetching GitHub issues:', error);
      throw error;
    }
  }

  private convertGitHubToLocal(githubIssue: GitHubIssue): LocalIssue {
    return {
      id: githubIssue.id,
      number: githubIssue.number,
      title: githubIssue.title,
      body: githubIssue.body || '',
      state: githubIssue.state,
      labels: githubIssue.labels.map(label => label.name),
      assignee: githubIssue.assignee?.login,
      created_at: githubIssue.created_at,
      updated_at: githubIssue.updated_at
    };
  }

  private async createGitHubIssue(localIssue: LocalIssue): Promise<GitHubIssue> {
    const response = await this.octokit.rest.issues.create({
      owner: this.owner,
      repo: this.repo,
      title: localIssue.title,
      body: localIssue.body || '',
      labels: localIssue.labels || [],
      assignee: localIssue.assignee
    });

    return response.data as GitHubIssue;
  }

  private async updateGitHubIssue(number: number, localIssue: LocalIssue): Promise<GitHubIssue> {
    const response = await this.octokit.rest.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      title: localIssue.title,
      body: localIssue.body || '',
      labels: localIssue.labels || [],
      assignee: localIssue.assignee,
      state: localIssue.state
    });

    return response.data as GitHubIssue;
  }

  private isNewer(date1: string, date2: string): boolean {
    return new Date(date1) > new Date(date2);
  }

  public async sync(): Promise<SyncResult> {
    console.log('Starting GitHub issue sync...');
    
    const result: SyncResult = {
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: []
    };

    try {
      // Load local and GitHub issues
      const localIssues = await this.loadLocalIssues();
      const githubIssues = await this.getGitHubIssues();

      console.log(`Found ${localIssues.length} local issues and ${githubIssues.length} GitHub issues`);

      // Create maps for easier lookup
      const localByNumber = new Map<number, LocalIssue>();
      const localById = new Map<number, LocalIssue>();
      const githubByNumber = new Map<number, GitHubIssue>();

      localIssues.forEach(issue => {
        if (issue.number) localByNumber.set(issue.number, issue);
        if (issue.id) localById.set(issue.id, issue);
      });

      githubIssues.forEach(issue => {
        githubByNumber.set(issue.number, issue);
      });

      const updatedLocalIssues: LocalIssue[] = [];

      // Process GitHub issues
      for (const githubIssue of githubIssues) {
        const localIssue = localByNumber.get(githubIssue.number);

        if (!localIssue) {
          // GitHub issue doesn't exist locally, add it
          updatedLocalIssues.push(this.convertGitHubToLocal(githubIssue));
          result.created++;
          console.log(`Added GitHub issue #${githubIssue.number} to local`);
        } else {
          // Compare timestamps
          if (this.isNewer(githubIssue.updated_at, localIssue.updated_at)) {
            // GitHub version is newer, update local
            updatedLocalIssues.push(this.convertGitHubToLocal(githubIssue));
            result.updated++;
            console.log(`Updated local issue #${githubIssue.number} from GitHub`);
          } else if (this.isNewer(localIssue.updated_at, githubIssue.updated_at)) {
            // Local version is newer, update GitHub
            try {
              await this.updateGitHubIssue(githubIssue.number, localIssue);
              updatedLocalIssues.push(localIssue);
              result.updated++;
              console.log(`Updated GitHub issue #${githubIssue.number} from local`);
            } catch (error) {
              result.errors.push(`Failed to update GitHub issue #${githubIssue.number}: ${error}`);
              updatedLocalIssues.push(localIssue);
            }
          } else {
            // Same timestamp, no change needed
            updatedLocalIssues.push(localIssue);
            result.unchanged++;
          }
        }
      }

      // Process local-only issues (create new issues on GitHub)
      for (const localIssue of localIssues) {
        if (!localIssue.number && !localIssue.id) {
          // This is a local-only issue, create it on GitHub
          try {
            const newGitHubIssue = await this.createGitHubIssue(localIssue);
            updatedLocalIssues.push(this.convertGitHubToLocal(newGitHubIssue));
            result.created++;
            console.log(`Created new GitHub issue #${newGitHubIssue.number} from local`);
          } catch (error) {
            result.errors.push(`Failed to create GitHub issue: ${error}`);
            updatedLocalIssues.push(localIssue);
          }
        }
      }

      // Save updated local issues
      this.saveLocalIssues(updatedLocalIssues);

      console.log('\nSync completed:');
      console.log(`- Created: ${result.created}`);
      console.log(`- Updated: ${result.updated}`);
      console.log(`- Unchanged: ${result.unchanged}`);
      console.log(`- Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(error => console.log(`- ${error}`));
      }

      return result;
    } catch (error) {
      console.error('Sync failed:', error);
      result.errors.push(`Sync failed: ${error}`);
      return result;
    }
  }
}

// Main execution
async function main() {
  try {
    const sync = new GitHubIssueSync();
    await sync.sync();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}