import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

const BusinessDocument = () => {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    setGenerating(true);
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let y = margin;

    const addPage = () => {
      pdf.addPage();
      y = margin;
    };

    const checkPageBreak = (height: number) => {
      if (y + height > pageHeight - margin) {
        addPage();
      }
    };

    const addTitle = (text: string, size: number = 24) => {
      checkPageBreak(20);
      pdf.setFontSize(size);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 30, 30);
      pdf.text(text, margin, y);
      y += size * 0.5;
      // Add underline
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(1);
      pdf.line(margin, y, margin + 60, y);
      y += 10;
    };

    const addSubtitle = (text: string) => {
      checkPageBreak(15);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(50, 50, 50);
      pdf.text(text, margin, y);
      y += 8;
    };

    const addParagraph = (text: string) => {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(70, 70, 70);
      const lines = pdf.splitTextToSize(text, contentWidth);
      lines.forEach((line: string) => {
        checkPageBreak(6);
        pdf.text(line, margin, y);
        y += 6;
      });
      y += 4;
    };

    const addBullet = (text: string) => {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(70, 70, 70);
      const lines = pdf.splitTextToSize(text, contentWidth - 10);
      lines.forEach((line: string, index: number) => {
        checkPageBreak(6);
        if (index === 0) {
          pdf.text('•', margin, y);
        }
        pdf.text(line, margin + 8, y);
        y += 6;
      });
    };

    const addStat = (value: string, label: string, x: number) => {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(245, 158, 11);
      pdf.text(value, x, y);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(label, x, y + 6);
    };

    // ============ COVER PAGE ============
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Decorative line
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(3);
    pdf.line(margin, 80, pageWidth - margin, 80);
    
    // Title
    pdf.setFontSize(48);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text("Lenny's Dojo", pageWidth / 2, 110, { align: 'center' });
    
    // Emoji placeholder
    pdf.setFontSize(60);
    pdf.text('🥋', pageWidth / 2, 60, { align: 'center' });
    
    // Tagline
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(245, 158, 11);
    pdf.text('Master Product Management Through Expert Wisdom', pageWidth / 2, 125, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Business Plan & Product Overview', pageWidth / 2, 160, { align: 'center' });
    pdf.text('Confidential Document', pageWidth / 2, 170, { align: 'center' });
    
    // Date
    pdf.setFontSize(12);
    pdf.text('January 2026', pageWidth / 2, 200, { align: 'center' });
    
    // Bottom line
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(3);
    pdf.line(margin, 220, pageWidth - margin, 220);

    // ============ TABLE OF CONTENTS ============
    addPage();
    addTitle('Table of Contents', 28);
    y += 5;
    
    const tocItems = [
      '1. Executive Summary',
      '2. Problem Statement',
      '3. Solution Overview',
      '4. Product Features',
      '5. Target Market',
      '6. Business Model',
      '7. Competitive Analysis',
      '8. Technology Stack',
      '9. Product Roadmap',
      '10. Success Metrics',
      '11. Team & Contact',
    ];
    
    tocItems.forEach((item, index) => {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      pdf.text(item, margin, y);
      pdf.text(`${index + 3}`, pageWidth - margin - 5, y, { align: 'right' });
      y += 10;
    });

    // ============ EXECUTIVE SUMMARY ============
    addPage();
    addTitle('1. Executive Summary');
    
    addParagraph("Lenny's Dojo is an AI-powered product management interview preparation platform that transforms insights from Lenny Rachitsky's renowned podcast into actionable practice questions and personalized coaching.");
    
    y += 5;
    pdf.setFillColor(255, 251, 235);
    pdf.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(146, 64, 14);
    pdf.text('Mission Statement', margin + 5, y + 8);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    const missionLines = pdf.splitTextToSize('"To democratize access to world-class product management wisdom by converting expert insights into structured, AI-coached interview preparation experiences."', contentWidth - 10);
    missionLines.forEach((line: string, i: number) => {
      pdf.text(line, margin + 5, y + 16 + (i * 5));
    });
    y += 40;
    
    checkPageBreak(30);
    addStat('200+', 'Podcast Episodes', margin + 10);
    addStat('9', 'Interview Types', margin + 70);
    addStat('AI', 'Powered Coaching', margin + 130);
    y += 20;
    
    addSubtitle('Key Value Propositions');
    addBullet('Real interview questions derived from actual product decisions at top companies');
    addBullet('AI-powered evaluation with detailed feedback on 5 key dimensions');
    addBullet('Framework library curated from industry experts');
    addBullet('Company-specific preparation paths');
    addBullet('Progress tracking with actionable insights');

    // ============ PROBLEM STATEMENT ============
    addPage();
    addTitle('2. Problem Statement');
    
    addSubtitle('The PM Interview Challenge');
    addParagraph('Product management interviews are notoriously difficult to prepare for. Unlike technical interviews with clear right/wrong answers, PM interviews require demonstrating nuanced thinking, strategic frameworks, and real-world decision-making skills.');
    
    y += 5;
    addSubtitle('Current Pain Points');
    addBullet('Generic practice questions lack context');
    addBullet('No feedback mechanism for practice answers');
    addBullet('Scattered resources across multiple platforms');
    addBullet('Difficulty simulating real interview pressure');
    addBullet('No structured progression tracking');
    
    y += 5;
    addSubtitle("Lenny's Dojo Solution");
    addBullet('Questions from real company decisions');
    addBullet('AI coaching with dimensional feedback');
    addBullet('Centralized, curated content library');
    addBullet('Timer modes for pressure simulation');
    addBullet('Comprehensive progress analytics');
    
    y += 10;
    addSubtitle('Market Opportunity');
    addParagraph('With over 300,000 product managers in the US alone and an average tenure of 2-3 years, the interview preparation market sees continuous demand. The premium placed on FAANG and top-tier company positions creates a willingness to invest in quality preparation tools.');

    // ============ SOLUTION OVERVIEW ============
    addPage();
    addTitle('3. Solution Overview');
    
    addParagraph("Lenny's Dojo leverages a unique content pipeline that extracts actionable intelligence from Lenny's Podcast—the #1 product management podcast—and transforms it into structured interview preparation experiences.");
    
    y += 5;
    addSubtitle('Intelligence Extraction Pipeline');
    addBullet('YouTube Transcripts → Auto-synced daily');
    addBullet('AI Processing → Gemini 2.5 Pro');
    addBullet('Structured Data → Companies, Frameworks');
    addBullet('Practice Questions → With model answers');
    
    y += 10;
    addSubtitle('Core Platform Components');
    addBullet('🏢 Company Intelligence - Deep dives into product decisions at top companies');
    addBullet('📚 Framework Library - Curated frameworks from industry experts');
    addBullet('🎯 Practice Sessions - Configurable mock interviews with AI evaluation');
    addBullet('📈 Progress Tracking - Performance analytics across dimensions');

    // ============ PRODUCT FEATURES ============
    addPage();
    addTitle('4. Product Features');
    
    addSubtitle('4.1 Interview Type Coverage');
    const interviewTypes = [
      '💬 Behavioral - Leadership & collaboration',
      '🎯 Product Sense - Intuition & judgment',
      '✏️ Product Design - User-centric solutions',
      '🔍 Root Cause Analysis - Problem diagnosis',
      '📊 Guesstimate - Market sizing & estimation',
      '⚙️ Technical - System understanding',
      '🤖 AI/ML - AI product challenges',
      '♟️ Strategy - Business & market strategy',
      '📈 Metrics - KPIs & measurement',
    ];
    interviewTypes.forEach(type => addBullet(type));
    
    y += 10;
    addSubtitle('4.2 AI Evaluation Dimensions');
    addParagraph('Every practice answer is evaluated across 5 key dimensions:');
    addBullet('Structure (20%) - Logical organization and clarity of thought');
    addBullet('Insight (25%) - Depth of analysis and unique perspectives');
    addBullet('Framework Usage (20%) - Appropriate application of PM frameworks');
    addBullet('Communication (15%) - Clarity, conciseness, and persuasiveness');
    addBullet('Outcome Orientation (20%) - Focus on results and impact');
    
    addPage();
    addSubtitle('4.3 Practice Session Configuration');
    addParagraph('Session Length Options:');
    addBullet('Quick Practice: 1 question (~10 min)');
    addBullet('Standard: 3 questions (~30 min)');
    addBullet('Extended: 5 questions (~50 min)');
    addBullet('Full Mock: 9 questions (~90 min)');
    
    y += 5;
    addParagraph('Timer Modes:');
    addBullet('No Timer: Untimed practice');
    addBullet('Relaxed: 1.5x suggested time');
    addBullet('Standard: Suggested time');
    addBullet('Pressure: 0.75x suggested time');

    // ============ TARGET MARKET ============
    addPage();
    addTitle('5. Target Market');
    
    addSubtitle('Primary Segments');
    y += 2;
    addParagraph('🎯 Aspiring PMs - Career switchers and new graduates breaking into product management.');
    addBullet('Market Size: ~150K annually in US');
    addBullet('Pain: Lack of real-world context');
    addBullet('Value: Expert insights & structured practice');
    
    y += 5;
    addParagraph('📈 Experienced PMs - Current PMs targeting senior roles at top companies.');
    addBullet('Market Size: ~300K in US');
    addBullet('Pain: Rusty interview skills');
    addBullet('Value: Company-specific prep');
    
    y += 10;
    addSubtitle('Market Size');
    checkPageBreak(30);
    addStat('$2.1B', 'Career Prep Market (US)', margin + 10);
    addStat('$450M', 'PM-Specific Segment', margin + 70);
    addStat('18%', 'Annual Growth Rate', margin + 130);
    y += 20;

    // ============ BUSINESS MODEL ============
    addPage();
    addTitle('6. Business Model');
    
    addSubtitle('Subscription Tiers');
    
    addParagraph('FREE ($0/month)');
    addBullet('Browse company intelligence');
    addBullet('View framework library');
    addBullet('3 practice questions/month');
    
    y += 3;
    addParagraph('PRO ($29/month) - Most Popular');
    addBullet('Everything in Free');
    addBullet('Unlimited practice questions');
    addBullet('AI evaluation & feedback');
    addBullet('Progress tracking');
    addBullet('All interview types');
    
    y += 3;
    addParagraph('ENTERPRISE (Custom Pricing)');
    addBullet('Everything in Pro');
    addBullet('Team management');
    addBullet('Custom question sets');
    addBullet('Analytics dashboard');
    addBullet('Dedicated support');
    
    y += 10;
    addSubtitle('Revenue Projections');
    addParagraph('Year 1: 5,000 MAU → 250 subscribers → $87K ARR');
    addParagraph('Year 2: 25,000 MAU → 1,750 subscribers → $609K ARR');
    addParagraph('Year 3: 100,000 MAU → 10,000 subscribers → $3.5M ARR');

    // ============ COMPETITIVE ANALYSIS ============
    addPage();
    addTitle('7. Competitive Analysis');
    
    addSubtitle('Competitive Advantages');
    
    y += 2;
    addParagraph("🎙️ Unique Content Source");
    addBullet('Exclusive access to insights from the #1 PM podcast, continuously updated');
    
    y += 3;
    addParagraph('🤖 AI-Powered Coaching');
    addBullet('Real-time, personalized feedback on practice answers—no waiting for human review');
    
    y += 3;
    addParagraph('🏢 Company-Specific Prep');
    addBullet('Questions tied to real decisions at specific companies for targeted preparation');
    
    y += 3;
    addParagraph('💰 Accessible Pricing');
    addBullet('$29/mo vs competitors at $99+/mo or $500+ one-time');
    
    y += 10;
    addSubtitle('Competitor Comparison');
    addParagraph('Feature comparison with Exponent, Product Alliance, Lewis C Lin:');
    addBullet("AI Evaluation: Lenny's Dojo ✓ | Others ✗");
    addBullet("Real Company Context: Lenny's Dojo ✓ | Others Partial/✗");
    addBullet("Auto-Updated Content: Lenny's Dojo ✓ | Others ✗");
    addBullet("Price: Lenny's Dojo $29/mo | Exponent $99/mo | Product Alliance $499");

    // ============ TECHNOLOGY STACK ============
    addPage();
    addTitle('8. Technology Stack');
    
    addSubtitle('Frontend');
    addBullet('React 18 - UI Framework');
    addBullet('TypeScript - Type Safety');
    addBullet('Tailwind CSS - Styling');
    addBullet('Vite - Build Tool');
    addBullet('TanStack Query - Data Fetching');
    addBullet('Zustand - State Management');
    
    y += 5;
    addSubtitle('Backend');
    addBullet('Supabase - Database & Auth');
    addBullet('Edge Functions - Serverless API');
    addBullet('PostgreSQL - Relational DB');
    addBullet('Row Level Security - Data Protection');
    
    y += 5;
    addSubtitle('AI Integration');
    addParagraph('Google Gemini 2.5 Pro processes podcast transcripts to extract companies, frameworks, decisions, and generate practice questions. AI also evaluates user answers with dimensional scoring.');
    
    y += 5;
    addSubtitle('Infrastructure');
    addBullet('Hosting: Lovable Cloud');
    addBullet('CDN: Global Edge Network');
    addBullet('Version Control: GitHub');

    // ============ PRODUCT ROADMAP ============
    addPage();
    addTitle('9. Product Roadmap');
    
    addSubtitle('Q1 2026 - Foundation (Current)');
    addBullet('Core practice flow with AI evaluation');
    addBullet('Company & framework intelligence');
    addBullet('User authentication & profiles');
    addBullet('Basic progress tracking');
    
    y += 5;
    addSubtitle('Q2 2026 - Enhancement');
    addBullet('Mock interview simulator');
    addBullet('Voice answer recording');
    addBullet('Peer practice matching');
    addBullet('Mobile-optimized experience');
    
    y += 5;
    addSubtitle('Q3 2026 - Expansion');
    addBullet('Enterprise team features');
    addBullet('Custom question creation');
    addBullet('Integration with job boards');
    addBullet('Advanced analytics dashboard');
    
    y += 5;
    addSubtitle('Q4 2026 - Scale');
    addBullet('Community features');
    addBullet('Mentor matching');
    addBullet('Certification program');
    addBullet('API for partners');

    // ============ SUCCESS METRICS ============
    addPage();
    addTitle('10. Success Metrics');
    
    addSubtitle('Engagement Metrics');
    addBullet('Daily Active Users (DAU): Target 1,000');
    addBullet('Questions per Session: Target 3.5+');
    addBullet('Session Duration: Target 25 min');
    addBullet('Weekly Active Users: Target 5,000');
    
    y += 5;
    addSubtitle('Business Metrics');
    addBullet('Conversion Rate (Free → Paid): Target 7%');
    addBullet('Monthly Churn Rate: Target <5%');
    addBullet('Customer Lifetime Value: Target $180');
    addBullet('Net Promoter Score: Target 50+');
    
    y += 5;
    addSubtitle('User Success Indicators');
    addBullet('Interview Pass Rate: 85% (for users with 20+ questions)');
    addBullet('User Satisfaction: 4.8/5 average rating');
    addBullet('Avg. Prep Duration: 2 weeks before successful interview');

    // ============ TEAM & CONTACT ============
    addPage();
    addTitle('11. Team & Contact');
    
    y += 10;
    pdf.setFontSize(40);
    pdf.text('🥋', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text("Lenny's Dojo", pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(245, 158, 11);
    pdf.text('Master Product Management Through Expert Wisdom', pageWidth / 2, y, { align: 'center' });
    y += 20;
    
    addSubtitle('Contact Information');
    addBullet('Website: lennysdojo.lovable.app');
    addBullet('Email: hello@lennysdojo.com');
    addBullet('Twitter: @lennysdojo');
    
    y += 10;
    addSubtitle('Legal Notice');
    addParagraph("Lenny's Dojo is an independent project. Not officially affiliated with Lenny Rachitsky. Content derived from publicly available podcast transcripts.");
    
    y += 20;
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text('This document is confidential and intended for business evaluation purposes only.', pageWidth / 2, y, { align: 'center' });
    y += 6;
    pdf.text("© 2026 Lenny's Dojo. All rights reserved.", pageWidth / 2, y, { align: 'center' });

    // Save the PDF
    pdf.save("Lennys_Dojo_Business_Plan.pdf");
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-md">
        <div className="text-8xl">🥋</div>
        <h1 className="text-3xl font-bold">Lenny's Dojo Business Plan</h1>
        <p className="text-muted-foreground">
          Download the complete business document including executive summary, market analysis, 
          product features, business model, competitive analysis, and roadmap.
        </p>
        <Button 
          onClick={generatePDF} 
          disabled={generating}
          size="lg"
          className="gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Download Business Plan PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default BusinessDocument;
