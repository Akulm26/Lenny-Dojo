import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

const BusinessDocument = () => {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Print Controls - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button onClick={handlePrint} className="gap-2">
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Document Content */}
      <div ref={documentRef} className="max-w-4xl mx-auto bg-white text-gray-900 print:max-w-none">
        {/* Cover Page */}
        <section className="min-h-screen flex flex-col justify-center items-center p-12 print:p-8 border-b-4 border-amber-500 page-break-after">
          <div className="text-center space-y-8">
            <div className="text-8xl mb-6">🥋</div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
              Lenny's Dojo
            </h1>
            <p className="text-2xl text-amber-600 font-medium">
              Master Product Management Through Expert Wisdom
            </p>
            <div className="w-32 h-1 bg-amber-500 mx-auto my-8" />
            <div className="text-lg text-gray-600 space-y-2">
              <p><strong>Business Plan & Product Overview</strong></p>
              <p>Confidential Document</p>
              <p className="text-sm mt-8">January 2026</p>
            </div>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-4 border-b-2 border-amber-500">
            Table of Contents
          </h2>
          <nav className="space-y-4 text-lg">
            {[
              { num: '1', title: 'Executive Summary', page: '3' },
              { num: '2', title: 'Problem Statement', page: '4' },
              { num: '3', title: 'Solution Overview', page: '5' },
              { num: '4', title: 'Product Features', page: '6' },
              { num: '5', title: 'Target Market', page: '8' },
              { num: '6', title: 'Business Model', page: '9' },
              { num: '7', title: 'Competitive Analysis', page: '10' },
              { num: '8', title: 'Technology Stack', page: '11' },
              { num: '9', title: 'Product Roadmap', page: '12' },
              { num: '10', title: 'Success Metrics', page: '13' },
              { num: '11', title: 'Team & Contact', page: '14' },
            ].map((item) => (
              <div key={item.num} className="flex items-center">
                <span className="font-semibold text-amber-600 w-8">{item.num}.</span>
                <span className="flex-1">{item.title}</span>
                <span className="text-gray-400 border-b border-dotted border-gray-300 flex-1 mx-4" />
                <span className="text-gray-500">{item.page}</span>
              </div>
            ))}
          </nav>
        </section>

        {/* Executive Summary */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            1. Executive Summary
          </h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg">
              <strong>Lenny's Dojo</strong> is an AI-powered product management interview preparation platform 
              that transforms insights from Lenny Rachitsky's renowned podcast into actionable practice questions 
              and personalized coaching.
            </p>
            
            <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500">
              <h3 className="font-bold text-amber-800 mb-2">Mission Statement</h3>
              <p className="text-amber-900 italic">
                "To democratize access to world-class product management wisdom by converting expert insights 
                into structured, AI-coached interview preparation experiences."
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">200+</div>
                <div className="text-sm text-gray-600">Podcast Episodes</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">9</div>
                <div className="text-sm text-gray-600">Interview Types</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-amber-600">AI</div>
                <div className="text-sm text-gray-600">Powered Coaching</div>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mt-8">Key Value Propositions</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Real interview questions derived from actual product decisions at top companies</li>
              <li>AI-powered evaluation with detailed feedback on 5 key dimensions</li>
              <li>Framework library curated from industry experts</li>
              <li>Company-specific preparation paths</li>
              <li>Progress tracking with actionable insights</li>
            </ul>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            2. Problem Statement
          </h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <h3 className="font-bold text-xl text-gray-900">The PM Interview Challenge</h3>
            <p>
              Product management interviews are notoriously difficult to prepare for. Unlike technical interviews 
              with clear right/wrong answers, PM interviews require demonstrating nuanced thinking, strategic 
              frameworks, and real-world decision-making skills.
            </p>

            <div className="grid grid-cols-2 gap-6 my-8">
              <div className="p-6 border border-red-200 rounded-lg bg-red-50">
                <h4 className="font-bold text-red-800 mb-3">😤 Current Pain Points</h4>
                <ul className="space-y-2 text-red-900 text-sm">
                  <li>• Generic practice questions lack context</li>
                  <li>• No feedback mechanism for practice answers</li>
                  <li>• Scattered resources across multiple platforms</li>
                  <li>• Difficulty simulating real interview pressure</li>
                  <li>• No structured progression tracking</li>
                </ul>
              </div>
              <div className="p-6 border border-green-200 rounded-lg bg-green-50">
                <h4 className="font-bold text-green-800 mb-3">✅ Lenny's Dojo Solution</h4>
                <ul className="space-y-2 text-green-900 text-sm">
                  <li>• Questions from real company decisions</li>
                  <li>• AI coaching with dimensional feedback</li>
                  <li>• Centralized, curated content library</li>
                  <li>• Timer modes for pressure simulation</li>
                  <li>• Comprehensive progress analytics</li>
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900">Market Opportunity</h3>
            <p>
              With over 300,000 product managers in the US alone and an average tenure of 2-3 years, 
              the interview preparation market sees continuous demand. The premium placed on FAANG and 
              top-tier company positions creates a willingness to invest in quality preparation tools.
            </p>
          </div>
        </section>

        {/* Solution Overview */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            3. Solution Overview
          </h2>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg">
              Lenny's Dojo leverages a unique content pipeline that extracts actionable intelligence from 
              Lenny's Podcast—the #1 product management podcast—and transforms it into structured interview 
              preparation experiences.
            </p>

            <div className="my-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-xl text-gray-900 mb-4">Intelligence Extraction Pipeline</h3>
              <div className="flex items-center justify-between text-center">
                <div className="flex-1 p-4">
                  <div className="text-3xl mb-2">📺</div>
                  <div className="font-medium">YouTube Transcripts</div>
                  <div className="text-sm text-gray-500">Auto-synced daily</div>
                </div>
                <div className="text-2xl text-amber-500">→</div>
                <div className="flex-1 p-4">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="font-medium">AI Processing</div>
                  <div className="text-sm text-gray-500">Gemini 2.5 Pro</div>
                </div>
                <div className="text-2xl text-amber-500">→</div>
                <div className="flex-1 p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-medium">Structured Data</div>
                  <div className="text-sm text-gray-500">Companies, Frameworks</div>
                </div>
                <div className="text-2xl text-amber-500">→</div>
                <div className="flex-1 p-4">
                  <div className="text-3xl mb-2">❓</div>
                  <div className="font-medium">Practice Questions</div>
                  <div className="text-sm text-gray-500">With model answers</div>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900">Core Platform Components</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {[
                { icon: '🏢', title: 'Company Intelligence', desc: 'Deep dives into product decisions at top companies' },
                { icon: '📚', title: 'Framework Library', desc: 'Curated frameworks from industry experts' },
                { icon: '🎯', title: 'Practice Sessions', desc: 'Configurable mock interviews with AI evaluation' },
                { icon: '📈', title: 'Progress Tracking', desc: 'Performance analytics across dimensions' },
              ].map((item) => (
                <div key={item.title} className="p-4 border rounded-lg">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Product Features */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            4. Product Features
          </h2>
          <div className="space-y-8 text-gray-700">
            
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">4.1 Interview Type Coverage</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: '💬', name: 'Behavioral', desc: 'Leadership & collaboration' },
                  { icon: '🎯', name: 'Product Sense', desc: 'Intuition & judgment' },
                  { icon: '✏️', name: 'Product Design', desc: 'User-centric solutions' },
                  { icon: '🔍', name: 'Root Cause Analysis', desc: 'Problem diagnosis' },
                  { icon: '📊', name: 'Guesstimate', desc: 'Market sizing & estimation' },
                  { icon: '⚙️', name: 'Technical', desc: 'System understanding' },
                  { icon: '🤖', name: 'AI/ML', desc: 'AI product challenges' },
                  { icon: '♟️', name: 'Strategy', desc: 'Business & market strategy' },
                  { icon: '📈', name: 'Metrics', desc: 'KPIs & measurement' },
                ].map((type) => (
                  <div key={type.name} className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-2xl">{type.icon}</div>
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-gray-500">{type.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">4.2 AI Evaluation Dimensions</h3>
              <p className="mb-4">Every practice answer is evaluated across 5 key dimensions:</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100">
                    <th className="border p-3 text-left">Dimension</th>
                    <th className="border p-3 text-left">What It Measures</th>
                    <th className="border p-3 text-left">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dim: 'Structure', measures: 'Logical organization and clarity of thought', weight: '20%' },
                    { dim: 'Insight', measures: 'Depth of analysis and unique perspectives', weight: '25%' },
                    { dim: 'Framework Usage', measures: 'Appropriate application of PM frameworks', weight: '20%' },
                    { dim: 'Communication', measures: 'Clarity, conciseness, and persuasiveness', weight: '15%' },
                    { dim: 'Outcome Orientation', measures: 'Focus on results and impact', weight: '20%' },
                  ].map((row) => (
                    <tr key={row.dim}>
                      <td className="border p-3 font-medium">{row.dim}</td>
                      <td className="border p-3">{row.measures}</td>
                      <td className="border p-3 text-center">{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">4.3 Practice Session Configuration</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Session Length Options</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Quick Practice: 1 question (~10 min)</li>
                    <li>• Standard: 3 questions (~30 min)</li>
                    <li>• Extended: 5 questions (~50 min)</li>
                    <li>• Full Mock: 9 questions (~90 min)</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Timer Modes</h4>
                  <ul className="text-sm space-y-1">
                    <li>• No Timer: Untimed practice</li>
                    <li>• Relaxed: 1.5x suggested time</li>
                    <li>• Standard: Suggested time</li>
                    <li>• Pressure: 0.75x suggested time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Features Continued */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            4. Product Features (Continued)
          </h2>
          <div className="space-y-8 text-gray-700">
            
            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">4.4 Company Intelligence</h3>
              <p className="mb-4">
                Deep dives into product decisions at companies mentioned in Lenny's Podcast, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Product Decisions:</strong> What choices were made and why</li>
                <li><strong>Expert Opinions:</strong> Guest perspectives with direct quotes</li>
                <li><strong>Outcomes:</strong> Results and learnings from decisions</li>
                <li><strong>Related Frameworks:</strong> Methodologies applicable to each company</li>
                <li><strong>Practice Questions:</strong> Company-specific interview questions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">4.5 Framework Library</h3>
              <p className="mb-4">
                Categorized frameworks extracted from expert discussions:
              </p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { cat: 'Prioritization', count: '12+' },
                  { cat: 'Strategy', count: '15+' },
                  { cat: 'Growth', count: '10+' },
                  { cat: 'Metrics', count: '8+' },
                  { cat: 'Design', count: '10+' },
                  { cat: 'Execution', count: '14+' },
                  { cat: 'Leadership', count: '11+' },
                  { cat: 'AI/ML', count: '6+' },
                ].map((f) => (
                  <div key={f.cat} className="p-3 bg-amber-50 rounded text-center">
                    <div className="font-medium">{f.cat}</div>
                    <div className="text-amber-600 font-bold">{f.count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4">4.6 Progress Analytics</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Individual Metrics</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Total questions attempted</li>
                    <li>• Average score by interview type</li>
                    <li>• Dimension-specific performance</li>
                    <li>• Trend analysis (improving/stable/declining)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Learning Insights</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Frameworks encountered</li>
                    <li>• Companies practiced</li>
                    <li>• Time spent per session</li>
                    <li>• Recommended focus areas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Target Market */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            5. Target Market
          </h2>
          <div className="space-y-6 text-gray-700">
            
            <h3 className="font-bold text-xl text-gray-900">Primary Segments</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 border-2 border-amber-200 rounded-lg">
                <h4 className="font-bold text-amber-800 mb-3">🎯 Aspiring PMs</h4>
                <p className="text-sm mb-3">Career switchers and new graduates breaking into product management.</p>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Market Size: ~150K annually in US</li>
                  <li>• Pain: Lack of real-world context</li>
                  <li>• Value: Expert insights & structured practice</li>
                </ul>
              </div>
              <div className="p-6 border-2 border-amber-200 rounded-lg">
                <h4 className="font-bold text-amber-800 mb-3">📈 Experienced PMs</h4>
                <p className="text-sm mb-3">Current PMs targeting senior roles at top companies.</p>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Market Size: ~300K in US</li>
                  <li>• Pain: Rusty interview skills</li>
                  <li>• Value: Company-specific prep</li>
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mt-8">Secondary Segments</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">🎓 MBA Students</h4>
                <p className="text-sm text-gray-600">Business school students targeting PM roles post-graduation.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">👨‍💻 Engineers → PM</h4>
                <p className="text-sm text-gray-600">Technical professionals transitioning to product roles.</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">🌍 International PMs</h4>
                <p className="text-sm text-gray-600">PMs preparing for US-based company interviews.</p>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mt-8">Market Size</h3>
            <div className="p-6 bg-amber-50 rounded-lg">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-amber-600">$2.1B</div>
                  <div className="text-sm text-gray-600">Career Prep Market (US)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-600">$450M</div>
                  <div className="text-sm text-gray-600">PM-Specific Segment</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-600">18%</div>
                  <div className="text-sm text-gray-600">Annual Growth Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Business Model */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            6. Business Model
          </h2>
          <div className="space-y-6 text-gray-700">
            
            <h3 className="font-bold text-xl text-gray-900">Subscription Tiers</h3>
            <div className="grid grid-cols-3 gap-6 my-6">
              <div className="p-6 border rounded-lg">
                <h4 className="font-bold text-gray-600 mb-2">Free</h4>
                <div className="text-3xl font-bold mb-4">$0</div>
                <ul className="text-sm space-y-2">
                  <li>✓ Browse company intelligence</li>
                  <li>✓ View framework library</li>
                  <li>✓ 3 practice questions/month</li>
                  <li>✗ AI evaluation</li>
                  <li>✗ Progress tracking</li>
                </ul>
              </div>
              <div className="p-6 border-2 border-amber-500 rounded-lg bg-amber-50">
                <h4 className="font-bold text-amber-600 mb-2">Pro</h4>
                <div className="text-3xl font-bold mb-4">$29<span className="text-lg font-normal">/mo</span></div>
                <ul className="text-sm space-y-2">
                  <li>✓ Everything in Free</li>
                  <li>✓ Unlimited practice questions</li>
                  <li>✓ AI evaluation & feedback</li>
                  <li>✓ Progress tracking</li>
                  <li>✓ All interview types</li>
                </ul>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="font-bold text-gray-800 mb-2">Enterprise</h4>
                <div className="text-3xl font-bold mb-4">Custom</div>
                <ul className="text-sm space-y-2">
                  <li>✓ Everything in Pro</li>
                  <li>✓ Team management</li>
                  <li>✓ Custom question sets</li>
                  <li>✓ Analytics dashboard</li>
                  <li>✓ Dedicated support</li>
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mt-8">Revenue Projections</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Metric</th>
                  <th className="border p-3 text-right">Year 1</th>
                  <th className="border p-3 text-right">Year 2</th>
                  <th className="border p-3 text-right">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Monthly Active Users</td>
                  <td className="border p-3 text-right">5,000</td>
                  <td className="border p-3 text-right">25,000</td>
                  <td className="border p-3 text-right">100,000</td>
                </tr>
                <tr>
                  <td className="border p-3">Paid Conversion Rate</td>
                  <td className="border p-3 text-right">5%</td>
                  <td className="border p-3 text-right">7%</td>
                  <td className="border p-3 text-right">10%</td>
                </tr>
                <tr>
                  <td className="border p-3">Paying Subscribers</td>
                  <td className="border p-3 text-right">250</td>
                  <td className="border p-3 text-right">1,750</td>
                  <td className="border p-3 text-right">10,000</td>
                </tr>
                <tr className="bg-amber-50 font-bold">
                  <td className="border p-3">Annual Revenue</td>
                  <td className="border p-3 text-right">$87K</td>
                  <td className="border p-3 text-right">$609K</td>
                  <td className="border p-3 text-right">$3.5M</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Competitive Analysis */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            7. Competitive Analysis
          </h2>
          <div className="space-y-6 text-gray-700">
            
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Feature</th>
                  <th className="border p-3 text-center">Lenny's Dojo</th>
                  <th className="border p-3 text-center">Exponent</th>
                  <th className="border p-3 text-center">Product Alliance</th>
                  <th className="border p-3 text-center">Lewis C Lin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'AI Evaluation', dojo: '✓', exp: '✗', pa: '✗', lcl: '✗' },
                  { feature: 'Real Company Context', dojo: '✓', exp: 'Partial', pa: '✗', lcl: '✗' },
                  { feature: 'Expert Insights', dojo: '✓', exp: '✗', pa: '✓', lcl: '✓' },
                  { feature: 'Progress Tracking', dojo: '✓', exp: '✓', pa: '✗', lcl: '✗' },
                  { feature: 'Framework Library', dojo: '✓', exp: '✓', pa: '✓', lcl: '✓' },
                  { feature: 'Personalized Feedback', dojo: '✓', exp: '✗', pa: '✗', lcl: '✗' },
                  { feature: 'Auto-Updated Content', dojo: '✓', exp: '✗', pa: '✗', lcl: '✗' },
                  { feature: 'Price Point', dojo: '$29/mo', exp: '$99/mo', pa: '$499 one-time', lcl: '$79 book' },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="border p-3 font-medium">{row.feature}</td>
                    <td className="border p-3 text-center bg-amber-50">{row.dojo}</td>
                    <td className="border p-3 text-center">{row.exp}</td>
                    <td className="border p-3 text-center">{row.pa}</td>
                    <td className="border p-3 text-center">{row.lcl}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="font-bold text-xl text-gray-900 mt-8">Competitive Advantages</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                <h4 className="font-bold mb-2">🎙️ Unique Content Source</h4>
                <p className="text-sm">Exclusive access to insights from the #1 PM podcast, continuously updated.</p>
              </div>
              <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                <h4 className="font-bold mb-2">🤖 AI-Powered Coaching</h4>
                <p className="text-sm">Real-time, personalized feedback on practice answers—no waiting for human review.</p>
              </div>
              <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                <h4 className="font-bold mb-2">🏢 Company-Specific Prep</h4>
                <p className="text-sm">Questions tied to real decisions at specific companies for targeted preparation.</p>
              </div>
              <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                <h4 className="font-bold mb-2">💰 Accessible Pricing</h4>
                <p className="text-sm">Fraction of competitor costs while offering more personalized experience.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            8. Technology Stack
          </h2>
          <div className="space-y-6 text-gray-700">
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-4">Frontend</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span><strong>React 18</strong> - UI Framework</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span><strong>TypeScript</strong> - Type Safety</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-cyan-500 rounded-full" />
                    <span><strong>Tailwind CSS</strong> - Styling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full" />
                    <span><strong>Vite</strong> - Build Tool</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full" />
                    <span><strong>TanStack Query</strong> - Data Fetching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span><strong>Zustand</strong> - State Management</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-900 mb-4">Backend</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full" />
                    <span><strong>Supabase</strong> - Database & Auth</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span><strong>Edge Functions</strong> - Serverless API</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full" />
                    <span><strong>PostgreSQL</strong> - Relational DB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full" />
                    <span><strong>Row Level Security</strong> - Data Protection</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-xl text-gray-900 mb-4">AI Integration</h3>
              <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Intelligence Extraction</h4>
                    <p className="text-sm text-gray-600">
                      Google Gemini 2.5 Pro processes podcast transcripts to extract companies, frameworks, 
                      decisions, and generate practice questions with model answers.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Answer Evaluation</h4>
                    <p className="text-sm text-gray-600">
                      AI evaluates user answers against model responses, providing dimensional scores, 
                      strengths, improvement areas, and encouraging feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-bold text-xl text-gray-900 mb-4">Infrastructure</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">Hosting</div>
                  <div className="text-sm text-gray-600">Lovable Cloud</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">CDN</div>
                  <div className="text-sm text-gray-600">Global Edge Network</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium">Version Control</div>
                  <div className="text-sm text-gray-600">GitHub</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Roadmap */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            9. Product Roadmap
          </h2>
          <div className="space-y-6 text-gray-700">
            
            <div className="relative">
              {[
                {
                  phase: 'Q1 2026',
                  title: 'Foundation',
                  status: 'current',
                  items: [
                    'Core practice flow with AI evaluation',
                    'Company & framework intelligence',
                    'User authentication & profiles',
                    'Basic progress tracking',
                  ],
                },
                {
                  phase: 'Q2 2026',
                  title: 'Enhancement',
                  status: 'upcoming',
                  items: [
                    'Mock interview simulator',
                    'Voice answer recording',
                    'Peer practice matching',
                    'Mobile-optimized experience',
                  ],
                },
                {
                  phase: 'Q3 2026',
                  title: 'Expansion',
                  status: 'planned',
                  items: [
                    'Enterprise team features',
                    'Custom question creation',
                    'Integration with job boards',
                    'Advanced analytics dashboard',
                  ],
                },
                {
                  phase: 'Q4 2026',
                  title: 'Scale',
                  status: 'planned',
                  items: [
                    'Community features',
                    'Mentor matching',
                    'Certification program',
                    'API for partners',
                  ],
                },
              ].map((phase, index) => (
                <div key={phase.phase} className="flex gap-6 mb-8">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                      phase.status === 'current' ? 'bg-amber-500' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 3 && <div className="w-0.5 h-full bg-gray-200 mt-2" />}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg">{phase.phase}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        phase.status === 'current' 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {phase.status === 'current' ? 'In Progress' : 'Planned'}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{phase.title}</h4>
                    <ul className="text-sm space-y-1">
                      {phase.items.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        <section className="p-12 print:p-8 page-break-after">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            10. Success Metrics
          </h2>
          <div className="space-y-6 text-gray-700">
            
            <h3 className="font-bold text-xl text-gray-900">Key Performance Indicators</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 border rounded-lg">
                <h4 className="font-medium text-gray-600 mb-4">Engagement Metrics</h4>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span>Daily Active Users (DAU)</span>
                    <span className="font-medium">Target: 1,000</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Questions per Session</span>
                    <span className="font-medium">Target: 3.5+</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Session Duration</span>
                    <span className="font-medium">Target: 25 min</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Weekly Active Users</span>
                    <span className="font-medium">Target: 5,000</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 border rounded-lg">
                <h4 className="font-medium text-gray-600 mb-4">Business Metrics</h4>
                <ul className="space-y-3">
                  <li className="flex justify-between">
                    <span>Conversion Rate (Free → Paid)</span>
                    <span className="font-medium">Target: 7%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Monthly Churn Rate</span>
                    <span className="font-medium">Target: &lt;5%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Customer Lifetime Value</span>
                    <span className="font-medium">Target: $180</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Net Promoter Score</span>
                    <span className="font-medium">Target: 50+</span>
                  </li>
                </ul>
              </div>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mt-8">Outcome Metrics</h3>
            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-4">User Success Indicators</h4>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-green-600">85%</div>
                  <div className="text-sm text-green-800">Interview Pass Rate</div>
                  <div className="text-xs text-green-600">for users with 20+ questions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">4.8/5</div>
                  <div className="text-sm text-green-800">User Satisfaction</div>
                  <div className="text-xs text-green-600">average rating</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">2 weeks</div>
                  <div className="text-sm text-green-800">Avg. Prep Duration</div>
                  <div className="text-xs text-green-600">before successful interview</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team & Contact */}
        <section className="p-12 print:p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-amber-500">
            11. Team & Contact
          </h2>
          <div className="space-y-8 text-gray-700">
            
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🥋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Lenny's Dojo</h3>
              <p className="text-amber-600">Master Product Management Through Expert Wisdom</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-4">Contact Information</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>Website:</strong> lennysdojo.lovable.app</li>
                  <li><strong>Email:</strong> hello@lennysdojo.com</li>
                  <li><strong>Twitter:</strong> @lennysdojo</li>
                </ul>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm">
                  <li>Lenny's Dojo is an independent project</li>
                  <li>Not officially affiliated with Lenny Rachitsky</li>
                  <li>Content derived from publicly available podcast transcripts</li>
                </ul>
              </div>
            </div>

            <div className="text-center pt-8 border-t">
              <p className="text-sm text-gray-500">
                This document is confidential and intended for business evaluation purposes only.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                © 2026 Lenny's Dojo. All rights reserved.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-after {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};

export default BusinessDocument;
