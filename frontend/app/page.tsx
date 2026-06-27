'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, AlertTriangle, Clock, GitBranch, BarChart3, Zap,
  Github, Linkedin, Twitter, Mail, ChevronDown, Users, Activity,
  Bell, MessageSquare, BookOpen
} from 'lucide-react';
import Logo from '@/components/ui/Logo';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const bgOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.5]);

  const problems = [
    { icon: AlertTriangle, title: 'Production Incidents Cause Downtime', desc: 'Every minute of downtime costs revenue, reputation, and customer trust. Yet most teams react instead of preventing.' },
    { icon: Clock, title: 'Alarms Wake You at 2 AM', desc: 'Pagers go off repeatedly. Context switching eats precious minutes while your system burns. Sleep becomes a luxury.' },
    { icon: GitBranch, title: 'Manual Escalations Are Slow', desc: 'SSH into servers, grep through logs, run scripts by hand. Every incident becomes a chaotic fire drill with no playbook.' },
  ];

  const solutions = [
    { icon: Bell, title: 'Automated Alert Handling', desc: 'Alerts from any source are ingested, deduplicated, and prioritized. PulseOps automatically classifies severity and routes to the right team.' },
    { icon: BookOpen, title: 'Intelligent Runbook Execution', desc: 'When an incident matches trigger conditions, PulseOps executes runbooks automatically — calling APIs, sending notifications, and logging every step.' },
    { icon: MessageSquare, title: 'Seamless Team Communication', desc: 'Real-time notifications via Slack, email, and in-app alerts. Keep everyone informed without the noise.' },
  ];

  const steps = [
    { step: '01', title: 'Create Workspace', desc: 'Set up your incident response workspace in seconds. Invite your team and define roles — owner, admin, engineer, or viewer.' },
    { step: '02', title: 'Add Team Members', desc: 'Invite colleagues via email. They get a secure invite link. New members sign up and join your workspace instantly.' },
    { step: '03', title: 'Upload Project', desc: 'Register your project with name, environment, repository URL, and base URL. PulseOps prepares to monitor your infrastructure.' },
    { step: '04', title: 'Auto-Detect APIs', desc: 'PulseOps scans your backend base URL and OpenAPI specs to automatically discover API endpoints, methods, and authentication requirements.' },
    { step: '05', title: 'Configure Monitoring', desc: 'Set check intervals, expected status codes, timeouts, and failure thresholds for each endpoint. Enable health checks with a single click.' },
    { step: '06', title: 'Receive Alerts', desc: 'When an endpoint fails, response time spikes, or error rate exceeds threshold — PulseOps creates an incident and notifies your team immediately.' },
    { step: '07', title: 'Execute Runbooks', desc: 'Automated runbooks trigger on incidents. They send notifications, call APIs, restart services, and log every action — all without human intervention.' },
  ];

  const features = [
    { icon: Zap, title: 'Alert Ingestion', desc: 'Ingest alerts from Grafana, Datadog, Prometheus, and any custom source via a universal webhook endpoint with automatic deduplication.' },
    { icon: Activity, title: 'API Monitoring', desc: 'Monitor endpoint health, response times, and status codes. Get alerted when APIs degrade or go down with configurable thresholds.' },
    { icon: Users, title: 'Workspace Management', desc: 'Organize teams, projects, and settings into isolated workspaces. Each workspace has its own members, roles, and configuration.' },
    { icon: MessageSquare, title: 'Team Collaboration', desc: 'Real-time incident updates, team comments, assignment workflows, and escalation policies keep everyone aligned during incidents.' },
    { icon: BookOpen, title: 'Automated Runbooks', desc: 'Visual runbook builder with HTTP, shell, Slack, AWS, and wait steps. Execute automatically on incident triggers with full audit trails.' },
    { icon: Bell, title: 'Real-Time Incident Status', desc: 'Live dashboard with WebSocket-powered updates. See incidents open, investigating, mitigating, or resolved in real time.' },
    { icon: Mail, title: 'Email Notifications', desc: 'Get notified via email for critical incidents, status changes, and runbook failures. Configurable notification preferences per user.' },
    { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track MTTR trends, resolution rates, incident sources, and team performance. Identify bottlenecks and improve over time.' },
  ];

  return (
    <div className="bg-pulseops-bg text-pulseops-text overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-pulseops-cyanGlow via-pulseops-cyanLight/5 to-pulseops-bg pointer-events-none"
          style={{ opacity: bgOpacity }}
        />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#7EC8E3 1px, transparent 1px), linear-gradient(90deg, #7EC8E3 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-8"
          >
            <Logo size={64} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight"
          >
            Resolve incidents faster with
            <span className="block text-pulseops-cyan mt-2">intelligent automation.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-pulseops-muted mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            PulseOps ingests alerts, executes runbooks, and helps teams resolve
            production incidents in minutes instead of hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/signup"
              className="group flex items-center gap-2 px-6 py-2.5 bg-pulseops-cyan text-pulseops-bg font-semibold rounded-xl hover:bg-pulseops-cyan/90 transition-all hover:shadow-lg hover:shadow-pulseops-cyan/20 text-sm"
            >
              Sign Up
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 px-6 py-2.5 border border-pulseops-border text-pulseops-muted hover:text-pulseops-text rounded-xl hover:border-pulseops-cyan/30 transition-all text-sm"
            >
              How it works
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-pulseops-muted/50">Scroll to explore</span>
            <ChevronDown size={20} className="text-pulseops-muted" />
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Incident Response is Broken
            </h2>
            <p className="text-pulseops-muted text-lg">
              Production incidents, alerts at 2 AM, downtime, and manual escalations
              are slow, stressful, and error-prone.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative bg-pulseops-surface border border-pulseops-border rounded-xl p-6 text-center group hover:border-pulseops-danger/30 hover:shadow-lg hover:shadow-pulseops-danger/5 transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-pulseops-border flex items-center justify-center group-hover:bg-pulseops-danger/10 transition-colors">
                  <item.icon size={24} className="text-pulseops-danger" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-pulseops-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <span className="text-2xl font-heading font-bold text-pulseops-cyan">→ PulseOps changes this</span>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-4 bg-pulseops-surface/50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              How PulseOps Fixes Incident Response
            </h2>
            <p className="text-pulseops-muted text-lg">
              Automate alert handling, runbook execution, and team communication —
              so you can resolve incidents before they escalate.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {solutions.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-pulseops-surface border border-pulseops-cyan/20 rounded-xl p-6 text-center group hover:border-pulseops-cyan/40 hover:shadow-lg hover:shadow-pulseops-cyan/5 transition-all"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-pulseops-cyan/10 flex items-center justify-center group-hover:bg-pulseops-cyan/20 transition-colors">
                  <item.icon size={24} className="text-pulseops-cyan" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2 text-pulseops-cyan">{item.title}</h3>
                <p className="text-sm text-pulseops-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — 7 Steps */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">How It Works</h2>
            <p className="text-pulseops-muted text-lg">From setup to resolution — PulseOps automates the entire incident lifecycle</p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Row 1: Steps 1-4 */}
            {steps.slice(0, 4).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <motion.div
                  className="text-4xl md:text-5xl font-heading font-bold text-pulseops-cyan mb-3"
                  whileHover={{ scale: 1.1 }}
                >
                  {item.step}
                </motion.div>
                <h3 className="text-base font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-pulseops-muted leading-relaxed px-2">{item.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-6 -right-3 text-pulseops-muted/20">
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Row 2: Steps 5-7 */}
          <div className="grid md:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto">
            {steps.slice(4).map((item, i) => (
              <motion.div
                key={i + 4}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative text-center"
              >
                <motion.div
                  className="text-4xl md:text-5xl font-heading font-bold text-pulseops-cyan mb-3"
                  whileHover={{ scale: 1.1 }}
                >
                  {item.step}
                </motion.div>
                <h3 className="text-base font-heading font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-pulseops-muted leading-relaxed px-2">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden lg:block absolute top-6 -right-3 text-pulseops-muted/20">
                    <ArrowRight size={20} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 bg-pulseops-surface/50">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Everything You Need</h2>
            <p className="text-pulseops-muted text-lg">Enterprise-grade features for modern incident response teams</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-pulseops-surface border border-pulseops-border rounded-xl p-5 hover:border-pulseops-cyanLight/30 hover:bg-pulseops-cyanLight/5 transition-all group hover:shadow-lg hover:shadow-pulseops-cyanLight/5"
              >
                <div className="w-10 h-10 rounded-lg bg-pulseops-cyanLight/15 flex items-center justify-center mb-3 group-hover:bg-pulseops-cyanLight/25 transition-colors">
                  <feature.icon size={20} className="text-pulseops-cyanLight" />
                </div>
                <h3 className="font-heading font-semibold mb-1 text-sm">{feature.title}</h3>
                <p className="text-xs text-pulseops-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h2 {...fadeInUp} className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Built For Modern Infrastructure
          </motion.h2>
          <motion.p {...fadeInUp} className="text-pulseops-muted mb-12">
            Powered by industry-standard tools and frameworks
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 items-center"
          >
            {[
              { name: 'Next.js', desc: 'React Framework' },
              { name: 'Node.js', desc: 'Runtime' },
              { name: 'TypeScript', desc: 'Language' },
              { name: 'MongoDB', desc: 'Database' },
              { name: 'Redis', desc: 'Queue & Cache' },
              { name: 'BullMQ', desc: 'Job Queue' },
              { name: 'Socket.io', desc: 'WebSocket' },
              { name: 'Docker', desc: 'Container' },
            ].map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-6 py-4 bg-pulseops-surface border border-pulseops-border rounded-xl hover:border-pulseops-cyanLight/30 hover:shadow-md hover:shadow-pulseops-cyanLight/5 transition-all"
              >
                <p className="font-mono text-sm font-semibold text-pulseops-text">{tech.name}</p>
                <p className="text-xs text-pulseops-muted mt-0.5">{tech.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-pulseops-surface/50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Ready to automate your incident response?
          </h2>
          <p className="text-pulseops-muted text-lg mb-8">
            Get started in minutes. Create your workspace, invite your team, and let PulseOps handle the rest.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-pulseops-cyan text-pulseops-bg font-semibold rounded-xl hover:bg-pulseops-cyan/90 transition-all hover:shadow-lg hover:shadow-pulseops-cyan/20"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-pulseops-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-xs text-pulseops-muted">© 2024 PulseOps. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            {[
              { icon: Github, href: 'https://github.com/H4rshalshah', label: 'GitHub' },
              { icon: Linkedin, href: 'https://www.linkedin.com/in/h4rshal/', label: 'LinkedIn' },
              { icon: Twitter, href: 'https://x.com/H4rshalshah', label: 'Twitter' },
              { icon: Mail, href: 'mailto:h4rshal.workspace@gmail.com', label: 'Email' },
            ].map((social, i) => (
              <motion.a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg hover:bg-pulseops-border text-pulseops-muted hover:text-pulseops-text transition-all"
                whileHover={{ scale: 1.1 }}
                title={social.label}
              >
                <social.icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
