package app

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"sync"
)

const (
	DISCORD_INVITE_ID = "gysskqts6z"
	GITHUB_REPO_OWNER = "keyboard-sounds"
	GITHUB_REPO_NAME  = "keyboardsounds-pro"
)

type Community struct {
	onlineCount int
	totalCount  int
	starCount   int
	forkCount   int
	issueCount  int

	statsLock      sync.RWMutex
	statsLoaded    bool
	githubStatsLock sync.RWMutex
	githubStatsLoaded bool
}

func NewCommunity() *Community {
	return &Community{}
}

// CommunityBinding is the Wails binding for the community UI
type CommunityBinding struct {
	community *Community
}

// NewCommunityBinding creates a new CommunityBinding instance
func NewCommunityBinding() *CommunityBinding {
	return &CommunityBinding{
		community: NewCommunity(),
	}
}

// GetInviteURL returns the Discord invite URL
func (cb *CommunityBinding) GetInviteURL() string {
	return cb.community.GetInviteURL()
}

// GetOnlineCount returns the number of members currently online
func (cb *CommunityBinding) GetOnlineCount() int {
	return cb.community.GetOnlineCount()
}

// GetTotalCount returns the total number of members on the server
func (cb *CommunityBinding) GetTotalCount() int {
	return cb.community.GetTotalCount()
}

// GetStarCount returns the number of stars on the GitHub repository
func (cb *CommunityBinding) GetStarCount() int {
	return cb.community.GetStarCount()
}

// GetForkCount returns the number of forks on the GitHub repository
func (cb *CommunityBinding) GetForkCount() int {
	return cb.community.GetForkCount()
}

// GetIssueCount returns the number of open issues on the GitHub repository
func (cb *CommunityBinding) GetIssueCount() int {
	return cb.community.GetIssueCount()
}

func (c *Community) GetOnlineCount() int {
	if err := c.loadStats(); err != nil {
		slog.Error("Failed to load community stats", "error", err)
	}

	return c.onlineCount
}

func (c *Community) GetTotalCount() int {
	if err := c.loadStats(); err != nil {
		slog.Error("Failed to load community stats", "error", err)
	}

	return c.totalCount
}

func (c *Community) GetStarCount() int {
	if err := c.loadGitHubStats(); err != nil {
		slog.Error("Failed to load GitHub stats", "error", err)
	}

	return c.starCount
}

func (c *Community) GetForkCount() int {
	if err := c.loadGitHubStats(); err != nil {
		slog.Error("Failed to load GitHub stats", "error", err)
	}

	return c.forkCount
}

func (c *Community) GetIssueCount() int {
	if err := c.loadGitHubStats(); err != nil {
		slog.Error("Failed to load GitHub stats", "error", err)
	}

	return c.issueCount
}

func (c *Community) GetInviteURL() string {
	return fmt.Sprintf("https://discord.gg/%s", DISCORD_INVITE_ID)
}

func (c *Community) loadStats() error {
	c.statsLock.Lock()
	defer c.statsLock.Unlock()
	if c.statsLoaded {
		return nil
	}

	url := fmt.Sprintf("https://discord.com/api/v9/invites/%s?with_counts=true", DISCORD_INVITE_ID)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	type statsResponse struct {
		Profile struct {
			OnlineCount int `json:"online_count"`
			MemberCount int `json:"member_count"`
		} `json:"profile"`
	}

	var stats statsResponse
	if err := json.Unmarshal(body, &stats); err != nil {
		return err
	}

	c.onlineCount = stats.Profile.OnlineCount
	c.totalCount = stats.Profile.MemberCount
	c.statsLoaded = true

	return nil
}

func (c *Community) loadGitHubStats() error {
	c.githubStatsLock.Lock()
	defer c.githubStatsLock.Unlock()
	if c.githubStatsLoaded {
		return nil
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s/%s", GITHUB_REPO_OWNER, GITHUB_REPO_NAME)
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	type githubResponse struct {
		StargazersCount int `json:"stargazers_count"`
		ForksCount      int `json:"forks_count"`
		OpenIssuesCount int `json:"open_issues_count"`
	}

	var repo githubResponse
	if err := json.Unmarshal(body, &repo); err != nil {
		return err
	}

	c.starCount = repo.StargazersCount
	c.forkCount = repo.ForksCount
	c.issueCount = repo.OpenIssuesCount
	c.githubStatsLoaded = true

	return nil
}
