import { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import GroupsIcon from '@mui/icons-material/Groups';
import ForumIcon from '@mui/icons-material/Forum';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BuildIcon from '@mui/icons-material/Build';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import GitHubIcon from '@mui/icons-material/GitHub';
import StarIcon from '@mui/icons-material/Star';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import BugReportIcon from '@mui/icons-material/BugReport';
import { GlassCard, PageHeader } from '../components/common';
import DiscordIcon from '../components/icons/DiscordIcon';
import { GetInviteURL, GetOnlineCount, GetTotalCount, GetStarCount, GetForkCount, GetIssueCount } from '../../wailsjs/go/app/CommunityBinding';
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime';

function CommunityPage() {
  const [inviteURL, setInviteURL] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [starCount, setStarCount] = useState(0);
  const [forkCount, setForkCount] = useState(0);
  const [issueCount, setIssueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        const [url, online, total, stars, forks, issues] = await Promise.all([
          GetInviteURL(),
          GetOnlineCount(),
          GetTotalCount(),
          GetStarCount(),
          GetForkCount(),
          GetIssueCount(),
        ]);
        setInviteURL(url);
        setOnlineCount(online);
        setTotalCount(total);
        setStarCount(stars);
        setForkCount(forks);
        setIssueCount(issues);
      } catch (error) {
        console.error('Failed to fetch community data:', error);
        // Fallback values
        setInviteURL('https://discord.gg/keyboardsounds');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  const handleJoinDiscord = () => {
    if (inviteURL) {
      BrowserOpenURL(inviteURL);
    }
  };

  const handleOpenGitHub = () => {
    BrowserOpenURL('https://github.com/keyboard-sounds/keyboardsounds-pro');
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  return (
    <Box>
      <PageHeader title="Community" />

      {/* Join Discord Hero Card */}
      <GlassCard 
        sx={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.15) 0%, var(--card-bg))',
          border: '1px solid rgba(88, 101, 242, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Discord Logo */}
          <Box
            sx={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(88, 101, 242, 0.4)',
              flexShrink: 0,
            }}
          >
            <DiscordIcon sx={{ fontSize: '44px', color: 'white' }} />
          </Box>

          {/* Text Content */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              Join Our Community
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '15px',
                lineHeight: 1.6,
                maxWidth: '500px',
              }}
            >
              Connect with fellow keyboard enthusiasts, share your custom sound profiles, 
              get help, and stay updated on the latest features.
            </Typography>
          </Box>

          {/* Join Button */}
          <Button
            variant="contained"
            onClick={handleJoinDiscord}
            startIcon={<LaunchIcon />}
            sx={{
              background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '15px',
              padding: '12px 28px',
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(88, 101, 242, 0.4)',
              flexShrink: 0,
              '&:hover': {
                background: 'linear-gradient(135deg, #6875F5 0%, #8299EA 100%)',
                boxShadow: '0 6px 20px rgba(88, 101, 242, 0.5)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            Join Discord
          </Button>
        </Box>

        {/* Stats Row */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: '24px', 
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid var(--card-border)',
          }}
        >
          <StatBox 
            label="Members" 
            value={loading ? '...' : formatNumber(totalCount)} 
            color="#5865F2" 
          />
          <StatBox 
            label="Online" 
            value={loading ? '...' : formatNumber(onlineCount)} 
            color="#f59e0b" 
          />
        </Box>

        {/* What You'll Find Section */}
        <Box sx={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--card-border)' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            What You&apos;ll Find
          </Typography>

          {/* Feature Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {/* Community Profiles */}
            <FeatureItem
              icon={<GroupsIcon />}
              title="Profile Sharing"
              description="Share and discover custom keyboard sound profiles created by the community"
              color="#10b981"
            />

            {/* Discussions */}
            <FeatureItem
              icon={<ForumIcon />}
              title="Discussions"
              description="Chat about mechanical keyboards, switches, and audio customization"
              color="#8b5cf6"
            />

            {/* Showcase */}
            <FeatureItem
              icon={<EmojiEventsIcon />}
              title="Profile Showcase"
              description="Show off your best sound profiles and get featured by the community"
              color="#f59e0b"
            />

            {/* Support */}
            <FeatureItem
              icon={<SupportAgentIcon />}
              title="Support"
              description="Get help with setup, troubleshooting, and profile creation"
              color="#ec4899"
            />

            {/* Development Updates */}
            <FeatureItem
              icon={<NewReleasesIcon />}
              title="Updates"
              description="Be the first to know about new features and releases"
              color="#06b6d4"
            />

            {/* Beta Testing */}
            <FeatureItem
              icon={<BuildIcon />}
              title="Beta Testing"
              description="Help test new features before they're released to everyone"
              color="#f97316"
            />
          </Box>
        </Box>
      </GlassCard>

      {/* GitHub Card */}
      <GlassCard 
        sx={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, var(--card-bg))',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* GitHub Logo */}
          <Box
            sx={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
              flexShrink: 0,
            }}
          >
            <GitHubIcon sx={{ fontSize: '44px', color: 'white' }} />
          </Box>

          {/* Text Content */}
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              sx={{
                color: 'var(--text-primary)',
                fontSize: '24px',
                fontWeight: 700,
                marginBottom: '8px',
              }}
            >
              GitHub
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-secondary)',
                fontSize: '15px',
                lineHeight: 1.6,
                maxWidth: '500px',
              }}
            >
              Contribute to the project, report issues, request features, and explore the source code on GitHub.
            </Typography>
          </Box>

          {/* GitHub Button */}
          <Button
            variant="contained"
            onClick={handleOpenGitHub}
            startIcon={<LaunchIcon />}
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              fontWeight: 600,
              fontSize: '15px',
              padding: '12px 28px',
              borderRadius: '12px',
              textTransform: 'none',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
              flexShrink: 0,
              '&:hover': {
                background: 'linear-gradient(135deg, #9d6af7 0%, #8b5cf6 100%)',
                boxShadow: '0 6px 20px rgba(139, 92, 246, 0.5)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            View on GitHub
          </Button>
        </Box>

        {/* Stats Row */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: '24px', 
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid var(--card-border)',
          }}
        >
          <StatBox 
            label="Stars" 
            value={loading ? '...' : formatNumber(starCount)} 
            color="#8b5cf6" 
            icon={<StarIcon sx={{ fontSize: '18px', marginRight: '4px' }} />}
          />
          <StatBox 
            label="Forks" 
            value={loading ? '...' : formatNumber(forkCount)} 
            color="#8b5cf6" 
            icon={<ForkRightIcon sx={{ fontSize: '18px', marginRight: '4px' }} />}
          />
          <StatBox 
            label="Issues" 
            value={loading ? '...' : formatNumber(issueCount)} 
            color="#8b5cf6" 
            icon={<BugReportIcon sx={{ fontSize: '18px', marginRight: '4px' }} />}
          />
        </Box>

        {/* What You'll Find Section */}
        <Box sx={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--card-border)' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--text-primary)',
              fontSize: '18px',
              fontWeight: 600,
              marginBottom: '24px',
            }}
          >
            What You&apos;ll Find
          </Typography>

          {/* Feature Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {/* Contributing */}
            <FeatureItem
              icon={<BuildIcon />}
              title="Contributing"
              description="Submit pull requests, contribute code, and help improve the project"
              color="#8b5cf6"
            />

            {/* Issues & Bug Reports */}
            <FeatureItem
              icon={<BugReportIcon />}
              title="Issue Tracking"
              description="Report bugs, request features, and track development progress"
              color="#ec4899"
            />

            {/* Code Review */}
            <FeatureItem
              icon={<GroupsIcon />}
              title="Code Review"
              description="Review code changes, provide feedback, and maintain code quality"
              color="#10b981"
            />

            {/* Documentation */}
            <FeatureItem
              icon={<NewReleasesIcon />}
              title="Documentation"
              description="Read and contribute to project documentation and guides"
              color="#06b6d4"
            />

            {/* Discussions */}
            <FeatureItem
              icon={<ForumIcon />}
              title="Discussions"
              description="Engage in technical discussions and share ideas with developers"
              color="#f59e0b"
            />

            {/* Releases */}
            <FeatureItem
              icon={<EmojiEventsIcon />}
              title="Releases"
              description="Track releases, changelogs, and version history"
              color="#f97316"
            />
          </Box>
        </Box>
      </GlassCard>

    </Box>
  );
}

// Feature Item Component
function FeatureItem({ icon, title, description, color }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: '14px',
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: 'var(--hover-bg-light)',
        border: '1px solid var(--card-border)',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'var(--hover-bg)',
          border: `1px solid ${color}33`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box
        sx={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon && (
          <Box sx={{ color, fontSize: '22px', display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
        )}
      </Box>
      <Box>
        <Typography
          sx={{
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontWeight: 600,
            marginBottom: '4px',
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            color: 'var(--text-tertiary)',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

// Stat Box Component
function StatBox({ label, value, color, icon }) {
  return (
    <Box
      sx={{
        flex: 1,
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: `${color}10`,
        border: `1px solid ${color}25`,
        textAlign: 'center',
      }}
    >
      <Typography
        sx={{
          color,
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
        {value}
      </Typography>
      <Typography
        sx={{
          color: 'var(--text-tertiary)',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default CommunityPage;
