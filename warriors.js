(function () {
    'use strict';

    // Single source of truth for the Apps Script endpoint. Rotating the
    // deployment means editing this one line - contact.html and any other
    // page reads it from here via window.BNG_SHEET_URL.
    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzmvyTxr2PiiQ9HZcM91iy_IQ8ZAyjZfmbYur7g7CIR0gmNAQQdNtykODl3cj5lBbSN/exec';
    window.BNG_SHEET_URL = SHEET_URL;
    var GFORM_URL = 'https://docs.google.com/forms/u/3/d/e/1FAIpQLScoBESmtB9YkXkxAiE0wGY2_HjoV2o0kEdQqY5Thl1c0xKZPg/viewform';
    var SMS_SHORTCODE = '21064';

    // Hover intent: the panel only opens once the pointer has rested on the
    // bubble for FAB_HOVER_DELAY, so passing near it never triggers it.
    var FAB_HOVER_DELAY = 300;
    var FAB_COLLAPSE_DELAY = 400;

    // Fallback list, used only when policy-reviews-data.js has not been
    // generated/deployed. `node build.js` regenerates that file from the
    // <meta name="bng-policy"> tag on each page in policy-reviews/, so adding
    // a review page and running the build is all it takes to show up here.
    //
    // Third element is the status: "open" policies can still receive new
    // submissions, "closed" ones are retired and only appear in the opinions
    // browse table.
    var POLICY_REVIEW_OPTIONS = [
        ['civic education 2026', 'Civic Education, Citizen Engagement & Public Participation Policy 2026', 'closed'],
        ['wildlife conservation bill 2025', 'The Wildlife Conservation & Management Bill, 2025', 'closed'],
        ['public participation bill 2025', 'The Public Participation Bill, 2025', 'closed'],
        ['roads amendment bill 2024', 'The Kenya Roads (Amendment) Bill, 2024', 'open']
    ];

    // The generated file may predate the status field, so treat a missing
    // status as "open" rather than silently hiding a live policy.
    function isOpen(entry) {
        return !entry[2] || entry[2] === 'open';
    }

    // Only open policies, for the "which review is this about?" dropdown in the
    // submit form. Retired policies stay out of the form but are still labelled
    // by submissions.html for opinions already filed against them.
    function openPolicyOptions() {
        var list = window.BNG_POLICIES;
        if (list && list.length) {
            return list
                .filter(function (p) { return !p.status || p.status === 'open'; })
                .map(function (p) { return [p.key, p.label]; });
        }
        return POLICY_REVIEW_OPTIONS.filter(isOpen).map(function (p) { return [p[0], p[1]]; });
    }

    var SHARED_STYLES = `
.success-pop {
    animation: bng-pop .45s cubic-bezier(.68, -0.55, .27, 1.55) both;
}
@keyframes bng-pop {
    0% { transform: scale(0); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}
.success-check-wrap {
    animation: bng-fade 1.4s ease both;
}
.success-check-path {
    stroke-dasharray: 30;
    stroke-dashoffset: 30;
    animation: bng-draw .6s ease forwards .5s;
}
@keyframes bng-fade {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes bng-draw {
    to { stroke-dashoffset: 0; }
}
#bngSmsModal .bng-sms-modal-host {
    display: flex;
    min-height: 0;
}
.bng-fab-root {
    position: fixed;
    left: 1.25rem;
    bottom: 1.25rem;
    z-index: 80;
    display: none;
    flex-direction: column;
    align-items: flex-start;
    pointer-events: none;
}
.bng-fab-root.show {
    display: flex;
}
.bng-fab-bubble {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    background: #0f5132;
    color: #fff;
    padding: 0.85rem 1.15rem;
    border-radius: 9999px;
    font-weight: 800;
    font-size: 0.7rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    box-shadow: 0 14px 30px rgba(15, 81, 50, 0.35);
    cursor: pointer;
    border: none;
    pointer-events: auto;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.bng-fab-bubble:hover,
.bng-fab-root.expanded .bng-fab-bubble {
    transform: translateY(-2px);
    box-shadow: 0 18px 36px rgba(15, 81, 50, 0.42);
}
.bng-fab-ping {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: #fbbf24;
    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6);
    animation: bng-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
    flex-shrink: 0;
}
@keyframes bng-ping {
    0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6); }
    70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
    100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
}
.bng-fab-panel {
    width: min(22rem, calc(100vw - 2.5rem));
    max-height: 72vh;
    overflow-y: auto;
    background: #fff;
    border-radius: 1.25rem;
    box-shadow: 0 22px 46px rgba(0, 0, 0, 0.2);
    border: 1px solid #e5e7eb;
    opacity: 0;
    transform: translateY(14px) scale(0.95);
    transform-origin: bottom left;
    pointer-events: none;
    transition: opacity 0.22s ease, transform 0.22s ease;
    margin-bottom: 0.75rem;
}
.bng-fab-root.expanded .bng-fab-panel {
    opacity: 1;
    transform: translateY(0) scale(1);
    pointer-events: auto;
}
.bng-fab-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #0f5132;
    color: #fff;
    padding: 1rem 1.25rem;
    position: sticky;
    top: 0;
    z-index: 2;
}
.bng-fab-kicker {
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 700;
    color: #bbf7d0;
}
.bng-fab-title {
    font-size: 1.15rem;
    font-weight: 900;
    letter-spacing: 0.06em;
    text-transform: uppercase;
}
.bng-fab-close {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}
.bng-fab-close:hover {
    background: rgba(255, 255, 255, 0.24);
}
.bng-fab-banner {
    width: 100%;
    height: 11rem;
    object-fit: cover;
    display: block;
}
.bng-fab-body {
    padding: 1.1rem 1.25rem 1.35rem;
}
.bng-fab-body h4 {
    font-size: 0.72rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #0f5132;
    margin: 0 0 0.5rem;
}
.bng-fab-img {
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    margin-bottom: 1.1rem;
    display: block;
}
.bng-fab-shortcode {
    background: #fffbeb;
    border: 2px solid #fbbf24;
    border-radius: 0.75rem;
    padding: 0.85rem 1rem;
    margin-bottom: 1.25rem;
    text-align: center;
}
.bng-fab-shortcode-label {
    font-size: 0.6rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: #92400e;
}
.bng-fab-shortcode-value {
    font-size: 1.75rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    color: #0f5132;
    line-height: 1.15;
    margin: 0.15rem 0;
    font-variant-numeric: tabular-nums;
}
.bng-fab-shortcode-hint {
    font-size: 0.68rem;
    color: #92400e;
    line-height: 1.4;
}
.bng-fab-cta,
.bng-fab-cta-2 {
    width: 100%;
    display: block;
    text-align: center;
    padding: 0.85rem 1rem;
    border-radius: 0.6rem;
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: none;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
}
.bng-fab-cta {
    background: #0f5132;
    color: #fff;
    margin-bottom: 0.6rem;
}
.bng-fab-cta:hover {
    background: #0b3d26;
}
.bng-fab-cta-2 {
    background: transparent;
    color: #0f5132;
    border: 1px solid #0f5132;
}
.bng-fab-cta-2:hover {
    background: #0f5132;
    color: #fff;
}
@keyframes bng-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
}
.bng-fab-root.show .bng-fab-bubble {
    animation: bng-bob 3.4s ease-in-out infinite;
}
.bng-fab-root.expanded .bng-fab-bubble {
    animation: none;
}
@media (prefers-reduced-motion: reduce) {
    .bng-fab-root.show .bng-fab-bubble { animation: none; }
    .bng-fab-ping { animation: none; }
}

/* ---------------------------------------------------------------------------
   Site-wide accessibility.

   Injected from here rather than pasted into 16 pages so the fixes stay in one
   place. Only applies to elements that do not already declare their own
   focus treatment, so the Tailwind focus:ring-* utilities on inputs still win.
   --------------------------------------------------------------------------- */

/* Keyboard users get a visible focus ring. :focus-visible keeps it off for
   pointer clicks, which is where a ring looks like a bug. */
.bng-a11y-root :focus-visible,
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
summary:focus-visible,
[tabindex]:focus-visible {
    outline: 3px solid #0f5132;
    outline-offset: 2px;
    border-radius: 4px;
}
/* Never let an input's own border colour hide the ring. */
.bng-a11y-root input:focus-visible,
.bng-a11y-root textarea:focus-visible,
.bng-a11y-root select:focus-visible {
    outline-offset: 1px;
}
/* Elements that supply their own visible ring (Tailwind ring utilities, the
   dark-mode swap icons) should not also get the generic outline. */
.bng-a11y-root .focus\\:ring-2:focus-visible,
.bng-a11y-root .focus\\:border-brandGreen:focus-visible {
    outline: none;
}

/* Jump link. Visually hidden until focused, then pinned to the top-left. */
.bng-skip-link {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 200;
    background: #0f5132;
    color: #fff;
    padding: 12px 20px;
    font-weight: 800;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 0 0 8px 0;
}
.bng-skip-link:focus {
    left: 0;
}

/* Modals must be announced as dialogs and must keep focus inside. Without
   this a screen reader announces nothing and Tab walks out into the page
   behind the overlay. */
.bng-modal-host[role="dialog"][aria-modal="true"] {
    display: flex;
    overflow-y: auto;
}
.bng-visually-hidden {
    position: absolute !important;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
`;

    var MODAL_HTML = `
<div id="bngWarriorsModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bngModalTitle">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-bng-close></div>

    <div class="relative w-full max-w-2xl h-[92vh] sm:h-auto sm:max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        <div class="bg-brandGreen text-white px-5 sm:px-6 py-5 flex-shrink-0 relative">
            <button type="button" data-bng-close class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none font-bold transition-colors flex items-center justify-center" aria-label="Close">&times;</button>
            <div class="text-[10px] uppercase tracking-widest text-green-200 font-bold mb-1">Bonga Na Gava &middot; SUSO</div>
            <h3 id="bngModalTitle" class="text-xl sm:text-2xl font-black uppercase tracking-wide pr-10">Bonga Na Gava Warriors Application</h3>
            <p class="text-green-100 text-xs mt-1.5 leading-relaxed">Apply to join the Bonga Na Gava Warriors, youth selected by merit to give first hand thoughts, recommendations and opinions on proposed government policy, laws &amp; regulations.</p>
            <details class="mt-3 text-green-100/90 text-xs">
                <summary class="cursor-pointer font-bold uppercase tracking-wider text-[11px]">What is a BNG Warrior?</summary>
                <div class="mt-2 space-y-2 leading-relaxed">
                    <p>Warriors are selected youth who shape the Bonga Na Gava top line comments on any proposed policy, law or regulation, grounded in what SUSO stands for and the voice of the youth.</p>
                    <p>The platform is also a space for conservation and leadership champions, a safe space to discuss biodiversity and our environment, and a way for youth and communities to learn, practise and take part in public participation, online and in person.</p>
                </div>
            </details>
        </div>

        <div id="bngProgress" class="flex items-center px-5 sm:px-6 py-3 border-b border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-2 bng-step" data-bng-step-dot="1">
                <span class="bng-dot w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-colors">1</span>
                <span class="bng-step-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-colors">Personal</span>
            </div>
            <div class="bng-step-line h-0.5 flex-1 mx-2 rounded transition-colors" data-bng-step-line="1"></div>
            <div class="flex items-center gap-2 bng-step" data-bng-step-dot="2">
                <span class="bng-dot w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-colors">2</span>
                <span class="bng-step-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-colors">Participation</span>
            </div>
            <div class="bng-step-line h-0.5 flex-1 mx-2 rounded transition-colors" data-bng-step-line="2"></div>
            <div class="flex items-center gap-2 bng-step" data-bng-step-dot="3">
                <span class="bng-dot w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-colors">3</span>
                <span class="bng-step-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-colors">Why You</span>
            </div>
            <div class="bng-step-line h-0.5 flex-1 mx-2 rounded transition-colors" data-bng-step-line="3"></div>
            <div class="flex items-center gap-2 bng-step" data-bng-step-dot="4">
                <span class="bng-dot w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-colors">4</span>
                <span class="bng-step-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-colors">Expectations</span>
            </div>
        </div>

        <form id="bngWarriorsForm" class="flex flex-col flex-1 min-h-0" novalidate>
            <div id="bngStepsScroll" class="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 space-y-6">

                <div style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; opacity:0;" aria-hidden="true">
                    <label for="bngWebsite">Website</label>
                    <input type="text" id="bngWebsite" name="website" tabindex="-1" autocomplete="off">
                </div>

                <fieldset class="bng-warrior-step border-0 p-0 m-0 min-w-0" data-step="1">
                    <legend class="mb-5 w-full">
                        <span class="block text-2xl font-black text-brandDark uppercase tracking-tight">Personal Information</span>
                        <span class="block text-sm text-gray-400 font-medium mt-1">We want a biodiversity legacy not a catastrophe</span>
                    </legend>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div class="sm:col-span-2">
                            <label for="bngName" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name <span class="text-brandRed">*</span></label>
                            <input type="text" id="bngName" name="name" required autocomplete="name" placeholder="Jane Wanjiku" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <span class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Gender <span class="text-brandRed">*</span></span>
                            <div class="flex items-center gap-6 pt-2">
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngGender" value="Male" required class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> Male</label>
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngGender" value="Female" class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> Female</label>
                            </div>
                        </div>
                        <div>
                            <label for="bngDob" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Date of Birth <span class="text-brandRed">*</span></label>
                            <input type="date" id="bngDob" name="dob" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="bngPhone" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number <span class="text-brandRed">*</span></label>
                            <input type="tel" id="bngPhone" name="phone" required autocomplete="tel" placeholder="+254 700 000000" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="bngEmail" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email <span class="text-brandRed">*</span></label>
                            <input type="email" id="bngEmail" name="email" required autocomplete="email" placeholder="you@example.com" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="bngCounty" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">County of current residence <span class="text-brandRed">*</span></label>
                            <input type="text" id="bngCounty" name="countyResidence" required placeholder="e.g. Nairobi" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="bngStay" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">How long have you stayed there? <span class="text-brandRed">*</span></label>
                            <input type="text" id="bngStay" name="stayDuration" required placeholder="e.g. 5 years" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="bngHomeCounty" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Home County <span class="text-brandRed">*</span></label>
                            <input type="text" id="bngHomeCounty" name="homeCounty" required placeholder="e.g. Nakuru" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div>
                            <label for="bngGroup" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Youth Group or Conservation Organization Affiliation <span class="text-brandRed">*</span></label>
                            <input type="text" id="bngGroup" name="groupAffiliation" required placeholder="Name of group / org, or 'None'" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                        <div class="sm:col-span-2">
                            <label for="bngRole" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What do you do in relation to conservation / climate change? <span class="text-brandRed">*</span></label>
                            <textarea id="bngRole" name="conservationRole" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div class="sm:col-span-2">
                            <label for="bngOccupation" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What is your Occupation / Educational Institution? <span class="text-brandRed">*</span></label>
                            <input type="text" id="bngOccupation" name="occupation" required placeholder="e.g. Student - University of Nairobi" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        </div>
                    </div>
                </fieldset>

                <fieldset class="bng-warrior-step border-0 p-0 m-0 min-w-0 hidden" data-step="2">
                    <legend class="mb-5 w-full">
                        <span class="block text-2xl font-black text-brandDark uppercase tracking-tight">Public Participation</span>
                    </legend>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <span class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Have you heard of Public Participation before? <span class="text-brandRed">*</span></span>
                            <div class="flex items-center gap-6 pt-2">
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngHeard" value="Yes" required class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> Yes</label>
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngHeard" value="No" class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> No</label>
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngHeard" value="Maybe" class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> Maybe</label>
                            </div>
                        </div>
                        <div class="sm:col-span-2">
                            <label for="bngVoice" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Why do you believe your voice matters and that you can play a role when it comes to issues regarding Biodiversity &amp; Climate Change? <span class="text-brandRed">*</span></label>
                            <textarea id="bngVoice" name="voiceMatters" rows="3" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <span class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Have you taken part in any Public Participation at County or National Level? <span class="text-brandRed">*</span></span>
                            <div class="flex items-center gap-6 pt-2">
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngTaken" value="Yes" required class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> Yes</label>
                                <label class="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer"><input type="radio" name="bngTaken" value="No" class="w-4 h-4 text-brandGreen border-gray-300 focus:ring-brandGreen"> No</label>
                            </div>
                        </div>
                        <div class="sm:col-span-2">
                            <label for="bngPpDetails" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">If yes, share the details of your Public Participation</label>
                            <textarea id="bngPpDetails" name="ppDetails" rows="2" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="bng-warrior-step border-0 p-0 m-0 min-w-0 hidden" data-step="3">
                    <legend class="mb-5 w-full">
                        <span class="block text-2xl font-black text-brandDark uppercase tracking-tight">Why You?</span>
                        <span class="block text-sm text-gray-400 font-medium mt-1">Everyone says youth will lead us into the future, but our future is now!</span>
                    </legend>
                    <div class="grid grid-cols-1 gap-5">
                        <div>
                            <label for="bngStrengths" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Name three strengths of yours <span class="text-brandRed">*</span></label>
                            <textarea id="bngStrengths" name="strengths" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngWeaknesses" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Name three weaknesses of yours <span class="text-brandRed">*</span></label>
                            <textarea id="bngWeaknesses" name="weaknesses" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngWhyWarrior" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Why do you want to be a Stand Up Shout Out Bonga Na Gava Warrior? <span class="text-brandRed">*</span></label>
                            <textarea id="bngWhyWarrior" name="whyWarrior" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngValueAdd" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What value do you believe you shall add by being a Stand Up Shout Out Bonga Na Gava Warrior? <span class="text-brandRed">*</span></label>
                            <textarea id="bngValueAdd" name="valueAdd" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngMissing" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What is missing in the policy space for youth and communities that you would like to change? <span class="text-brandRed">*</span></label>
                            <textarea id="bngMissing" name="missingPolicy" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngClimateAction" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Name one climate action you have done in your youth <span class="text-brandRed">*</span></label>
                            <textarea id="bngClimateAction" name="climateAction" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngYouthImportance" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Why are youth important to the Biodiversity &amp; Climate Change Policy agenda? <span class="text-brandRed">*</span></label>
                            <textarea id="bngYouthImportance" name="youthImportance" rows="2" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                    </div>
                </fieldset>

                <fieldset class="bng-warrior-step border-0 p-0 m-0 min-w-0 hidden" data-step="4">
                    <legend class="mb-5 w-full">
                        <span class="block text-2xl font-black text-brandDark uppercase tracking-tight">Our Voices Be Heard, For Sustainability.</span>
                    </legend>
                    <div class="grid grid-cols-1 gap-5">
                        <div>
                            <label for="bngExpectations" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">What are your expectations as a Bonga Na Gava Warrior? <span class="text-brandRed">*</span></label>
                            <textarea id="bngExpectations" name="expectations" rows="3" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div>
                            <label for="bngQuestions" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Do you have any questions for us? <span class="text-brandRed">*</span></label>
                            <textarea id="bngQuestions" name="questions" rows="3" required class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                        </div>
                        <div class="bg-brandGreen/5 border border-brandGreen/20 rounded-xl p-4 text-center">
                            <p class="text-lg font-black text-brandGreen uppercase tracking-widest">Thank you for your time, Change Maker!</p>
                        </div>
                    </div>
                </fieldset>

            </div>

            <div class="border-t border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0 bg-white">
                <button type="button" id="bngBack" class="px-5 py-3 rounded-md font-bold text-xs uppercase tracking-widest bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">Back</button>
                <button type="button" id="bngNext" class="px-6 py-3 rounded-md font-bold text-xs uppercase tracking-widest bg-brandDark text-white hover:bg-brandGreen transition-colors">Continue</button>
            </div>

            <div class="text-center px-5 sm:px-6 pb-5 flex-shrink-0 bg-white">
                <a href="` + GFORM_URL + `" target="_blank" rel="noopener noreferrer" class="text-[11px] font-semibold text-gray-400 hover:text-brandGreen transition-colors">Prefer the Google Forms version? <span class="underline">Fill it in directly</span></a>
            </div>
        </form>

        <div id="bngWarriorsSuccess" class="hidden flex-1 min-h-0 overflow-y-auto px-6 py-10 text-center">
            <div class="success-pop mx-auto w-16 h-16 rounded-full bg-brandGreen/10 flex items-center justify-center mb-4">
                <div class="success-check-wrap flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-brandGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path class="success-check-path" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
            </div>
            <p class="text-2xl font-black text-brandGreen uppercase tracking-widest mb-2">Application received!</p>
            <p class="text-sm text-gray-600 leading-relaxed">Thanks for applying to join the Bonga Na Gava Warriors. Your application has been submitted and our team will be in touch.</p>
            <p class="text-xs text-gray-400 mt-4">Didn't receive confirmation? Email <a href="mailto:submissions.BNG@suso.world" class="text-brandGreen font-semibold hover:underline">submissions.BNG@suso.world</a></p>
            <button type="button" data-bng-close class="mt-6 w-full sm:w-auto px-8 py-3 rounded-md font-bold text-xs uppercase tracking-widest bg-brandDark text-white hover:bg-brandGreen transition-colors">Close</button>
        </div>
    </div>
</div>`;

    var SMS_MODAL_HTML = `
<div id="bngSmsModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bngSmsTitle">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-bng-sms-close></div>

    <div class="bng-sms-modal-host relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        <div class="bg-brandGreen text-white px-5 sm:px-6 py-5 flex-shrink-0 relative">
            <button type="button" data-bng-sms-close class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none font-bold transition-colors flex items-center justify-center" aria-label="Close">&times;</button>
            <div class="text-[10px] uppercase tracking-widest text-green-200 font-bold mb-1">Bonga Na Gava &middot; SUSO</div>
            <h3 id="bngSmsTitle" class="text-xl sm:text-2xl font-black uppercase tracking-wide pr-10">SMS Alerts</h3>
            <p class="text-green-100 text-xs mt-1.5 leading-relaxed">Opt in and we will text you the moment a new bill, policy or review drops. Then reply directly to that text with your opinions and submissions. No spam, ever.</p>
            <div class="mt-4 rounded-xl bg-white/10 border border-white/25 px-4 py-3 text-center">
                <div class="text-[10px] uppercase tracking-widest text-green-200 font-bold">SMS Shortcode</div>
                <div class="text-3xl font-black text-white tracking-[0.18em] my-0.5 tabular-nums">` + SMS_SHORTCODE + `</div>
                <div class="text-[11px] text-green-100 leading-snug">Send <strong>` + SMS_SHORTCODE + `</strong> to our SMS line to join instantly</div>
            </div>
        </div>

        <form id="bngSmsForm" class="flex flex-col flex-1 min-h-0" novalidate>
            <div class="bng-sms-fields flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 space-y-5 bg-white">

                <div style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; opacity:0;" aria-hidden="true">
                    <label for="bngSmsWebsite">Website</label>
                    <input type="text" id="bngSmsWebsite" name="website" tabindex="-1" autocomplete="off">
                </div>

                <div>
                    <label for="bngSmsName" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name <span class="text-brandRed">*</span></label>
                    <input type="text" id="bngSmsName" name="name" required autocomplete="name" placeholder="Jane Wanjiku" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                </div>
                <div>
                    <label for="bngSmsPhone" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Phone Number <span class="text-brandRed">*</span></label>
                    <input type="tel" id="bngSmsPhone" name="phone" required autocomplete="tel" placeholder="+254 700 000000" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                </div>
                <div>
                    <label for="bngSmsEmail" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Email <span class="normal-case font-normal text-gray-400">(optional)</span></label>
                    <input type="email" id="bngSmsEmail" name="email" placeholder="you@example.com" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                </div>

                <div class="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <input id="bngSmsConsent" name="consent" type="checkbox" required class="mt-1 w-4 h-4 bg-white border border-gray-300 rounded text-brandGreen focus:ring-brandGreen">
                    <div class="text-sm">
                        <label for="bngSmsConsent" class="font-semibold text-gray-800">I want to opt in to SMS updates from Bonga Na Gava.</label>
                        <p class="text-gray-500 mt-1">You will only hear from us when there is something new, a bill, policy or review. Reply <strong>STOP</strong> any time to unsubscribe. Standard message and data rates may apply.</p>
                    </div>
                </div>

                <p class="text-xs text-gray-400 leading-relaxed">We will never spam you or share your number with anyone. Reply directly to our texts to submit your opinions on the bills and policies we cover.</p>
            </div>

            <div class="border-t border-gray-100 px-5 sm:px-6 py-4 flex-shrink-0 bg-white">
                <button type="submit" id="bngSmsSubmit" class="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-black text-white bg-brandDark hover:bg-brandGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandGreen transition uppercase tracking-widest">Opt In to SMS Alerts</button>
            </div>
        </form>

        <div id="bngSmsSuccess" class="hidden flex-1 min-h-0 overflow-y-auto px-6 py-10 text-center">
            <div class="success-pop mx-auto w-16 h-16 rounded-full bg-brandGreen/10 flex items-center justify-center mb-4">
                <div class="success-check-wrap flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-brandGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path class="success-check-path" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
            </div>
            <p class="text-2xl font-black text-brandGreen uppercase tracking-widest mb-2">You're opted in!</p>
            <p class="text-sm text-gray-600 leading-relaxed">Welcome to the Bonga Na Gava SMS list. Our first alert will come your way when the next bill, policy or review drops. Reply <strong>STOP</strong> any time to opt out.</p>
            <p class="text-xs text-gray-400 mt-4">Didn't receive confirmation? Email <a href="mailto:submissions.BNG@suso.world" class="text-brandGreen font-semibold hover:underline">submissions.BNG@suso.world</a></p>
            <button type="button" data-bng-sms-close class="mt-6 w-full sm:w-auto px-8 py-3 rounded-md font-bold text-xs uppercase tracking-widest bg-brandDark text-white hover:bg-brandGreen transition-colors">Close</button>
        </div>
    </div>
</div>`;

    var OPINION_MODAL_HTML = `
<div id="bngOpinionModal" class="hidden fixed inset-0 z-[100] items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="bngOpinionTitle">
    <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" data-bng-opinion-close></div>

    <div class="bng-sms-modal-host relative w-full max-w-xl max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        <div class="bg-brandGreen text-white px-5 sm:px-6 py-5 flex-shrink-0 relative">
            <button type="button" data-bng-opinion-close class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none font-bold transition-colors flex items-center justify-center" aria-label="Close">&times;</button>
            <div class="text-[10px] uppercase tracking-widest text-green-200 font-bold mb-1">Bonga Na Gava &middot; SUSO</div>
            <h3 id="bngOpinionTitle" class="text-xl sm:text-2xl font-black uppercase tracking-wide pr-10">Submit Your View</h3>
            <p class="text-green-100 text-xs mt-1.5 leading-relaxed">Tell us what you think about the proposed policies and regulations we are reviewing. Your view is submitted straight to the Bonga Na Gava team and becomes part of our public participation submissions.</p>
        </div>

        <form id="bngOpinionForm" class="flex flex-col flex-1 min-h-0" novalidate>
            <div class="bng-sms-fields flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-6 space-y-5 bg-white">

                <div style="position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; opacity:0;" aria-hidden="true">
                    <label for="bngOpinionWebsite">Website</label>
                    <input type="text" id="bngOpinionWebsite" name="website" tabindex="-1" autocomplete="off">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label for="bngOpinionName" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Name <span class="text-brandRed">*</span></label>
                        <input type="text" id="bngOpinionName" name="name" required autocomplete="name" placeholder="Jane Wanjiku" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                    </div>
                    <div>
                        <label for="bngOpinionLocation" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Location <span class="text-brandRed">*</span></label>
                        <input type="text" id="bngOpinionLocation" name="location" required placeholder="County or town, e.g. Nakuru" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                    </div>
                </div>

                <div>
                    <label for="bngOpinionContact" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Contact <span class="text-brandRed">*</span></label>
                    <input type="text" id="bngOpinionContact" name="contact" required placeholder="Email or phone number" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                </div>

                <div>
                    <label for="bngOpinionReview" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Which policy review is your view on? <span class="text-brandRed">*</span></label>
                    <select id="bngOpinionReview" name="policyReview" required class="w-full px-4 py-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition">
                        <option value="">Select a policy review</option>
                    </select>
                </div>

                <div>
                    <label for="bngOpinionText" class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Your View <span class="text-brandRed">*</span></label>
                    <textarea id="bngOpinionText" name="opinion" rows="5" required placeholder="Share your opinion on the policy review" class="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brandGreen focus:border-transparent transition resize-none"></textarea>
                </div>
            </div>

            <div class="border-t border-gray-100 px-5 sm:px-6 py-4 flex-shrink-0 bg-white">
                <button type="submit" id="bngOpinionSubmit" class="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-black text-white bg-brandDark hover:bg-brandGreen focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brandGreen transition uppercase tracking-widest">Submit Your View</button>
            </div>
        </form>

        <div id="bngOpinionSuccess" class="hidden flex-1 min-h-0 overflow-y-auto px-6 py-10 text-center">
            <div class="success-pop mx-auto w-16 h-16 rounded-full bg-brandGreen/10 flex items-center justify-center mb-4">
                <div class="success-check-wrap flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9 text-brandGreen" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path class="success-check-path" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
            </div>
            <p class="text-2xl font-black text-brandGreen uppercase tracking-widest mb-2">Thank you!</p>
            <p class="text-sm text-gray-600 leading-relaxed">Your view has been submitted to the Bonga Na Gava team and will count towards our public participation submission for this policy review.</p>
            <p class="text-xs text-gray-400 mt-4">Didn't receive confirmation? Email <a href="mailto:submissions.BNG@suso.world" class="text-brandGreen font-semibold hover:underline">submissions.BNG@suso.world</a></p>
            <button type="button" data-bng-opinion-close class="mt-6 w-full sm:w-auto px-8 py-3 rounded-md font-bold text-xs uppercase tracking-widest bg-brandDark text-white hover:bg-brandGreen transition-colors">Close</button>
        </div>
    </div>
</div>`;

    var scriptSrc = (function () {
        var s = document.getElementsByTagName('script');
        for (var i = 0; i < s.length; i++) {
            if (/warriors\.js/.test(s[i].src)) return s[i].src;
        }
        return '';
    })();
    var IMG_BASE = scriptSrc.substring(0, scriptSrc.lastIndexOf('/') + 1);

    function buildSmsFabHtml() {
        return `
<div id="bngSmsFab" class="bng-fab-root" role="region" aria-label="BNG SMS alerts">
    <div id="bngSmsFabPanel" class="bng-fab-panel">
        <div class="bng-fab-head">
            <div>
                <div class="bng-fab-kicker">Bonga Na Gava &middot; SUSO</div>
                <div class="bng-fab-title">BNG SMS</div>
            </div>
            <button type="button" id="bngSmsFabClose" class="bng-fab-close" aria-label="Close">&times;</button>
        </div>
        <img src="` + IMG_BASE + `assets/images/bng_sms.jpeg" alt="BNG SMS" class="bng-fab-banner">
        <div class="bng-fab-body">
            <div class="bng-fab-shortcode">
                <div class="bng-fab-shortcode-label">SMS Shortcode</div>
                <div class="bng-fab-shortcode-value">` + SMS_SHORTCODE + `</div>
                <div class="bng-fab-shortcode-hint">Text this to our SMS line to join</div>
            </div>
            <h4>How BNG SMS works</h4>
            <img src="` + IMG_BASE + `assets/images/how_bng_sms.jpeg" alt="How BNG SMS works" class="bng-fab-img">
            <button type="button" id="bngSmsFabCta" class="bng-fab-cta">Get SMS Alerts</button>
            <button type="button" id="bngOpinionFabCta" class="bng-fab-cta-2">Share Your View</button>
        </div>
    </div>
    <button type="button" id="bngSmsFabBubble" class="bng-fab-bubble" aria-expanded="false">
        <span class="bng-fab-ping"></span>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4.75 3A2.75 2.75 0 002 5.75v8.5A2.75 2.75 0 004.75 17H7v3.25a.75.75 0 001.2.6L12.95 17h6.3A2.75 2.75 0 0022 14.25v-8.5A2.75 2.75 0 0019.25 3H4.75zm2 5.25a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0zm4.25 0a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0zm4.25 0a1.25 1.25 0 112.5 0 1.25 1.25 0 01-2.5 0z" clip-rule="evenodd" /></svg>
        BNG SMS
    </button>
</div>`;
    }

    var modal = null;
    var form = null;
    var scrollEl = null;
    var nextBtn = null;
    var backBtn = null;
    var steps = 4;
    var smsModal = null;
    var smsForm = null;
    var opinionModal = null;
    var opinionForm = null;
    var fabRoot = null;
    var fabBubble = null;
    var fabTimer = null;
    var fabHoverTimer = null;
    var fabCollapseTimer = null;
    var fabShown = false;
    var fabHovered = false;
    var fabPinned = false;

    var FIELD_IDS = [
        ['bngName', 'name'],
        ['bngDob', 'dob'],
        ['bngPhone', 'phone'],
        ['bngEmail', 'email'],
        ['bngCounty', 'countyResidence'],
        ['bngStay', 'stayDuration'],
        ['bngHomeCounty', 'homeCounty'],
        ['bngGroup', 'groupAffiliation'],
        ['bngRole', 'conservationRole'],
        ['bngOccupation', 'occupation'],
        ['bngVoice', 'voiceMatters'],
        ['bngPpDetails', 'ppDetails'],
        ['bngStrengths', 'strengths'],
        ['bngWeaknesses', 'weaknesses'],
        ['bngWhyWarrior', 'whyWarrior'],
        ['bngValueAdd', 'valueAdd'],
        ['bngMissing', 'missingPolicy'],
        ['bngClimateAction', 'climateAction'],
        ['bngYouthImportance', 'youthImportance'],
        ['bngExpectations', 'expectations'],
        ['bngQuestions', 'questions']
    ];

    var RADIO_NAMES = [
        ['bngGender', 'gender'],
        ['bngHeard', 'heardPublicParticipation'],
        ['bngTaken', 'takenPartPublicParticipation']
    ];

    function init() {
        modal = document.getElementById('bngWarriorsModal');
        if (!modal) {
            var div = document.createElement('div');
            div.innerHTML = MODAL_HTML.trim();
            modal = div.firstElementChild;
            document.body.appendChild(modal);
        }

        form = document.getElementById('bngWarriorsForm');
        scrollEl = document.getElementById('bngStepsScroll');
        nextBtn = document.getElementById('bngNext');
        backBtn = document.getElementById('bngBack');

        modal.querySelectorAll('[data-bng-close]').forEach(function (el) {
            el.addEventListener('click', closeModal);
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) closeModal();
        });

        nextBtn.addEventListener('click', onNext);
        backBtn.addEventListener('click', onBack);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
            if (e.key === 'Escape' && smsModal && !smsModal.classList.contains('hidden')) closeSmsModal();
            if (e.key === 'Escape' && opinionModal && !opinionModal.classList.contains('hidden')) closeOpinionModal();
        });

        // Remember the control that opened an overlay so focus returns to it on
        // close. Capture phase so it runs before the open handlers. The dialog
        // elements are read at click time rather than captured here, because the
        // SMS and opinion modals do not exist yet.
        document.addEventListener('click', function (e) {
            var t = e.target && e.target.closest ? e.target.closest('a[href], button') : null;
            if (!t) return;
            [modal, document.getElementById('bngSmsModal'), document.getElementById('bngOpinionModal')]
                .forEach(function (d) { if (d) d.__bngTrigger = t; });
        }, true);


        // The modal is injected just above this point, and it contains its own
        // "prefer the Google Forms version" escape hatch pointing at GFORM_URL.
        // Skip that one, otherwise the only route to the real form reopens this
        // modal instead.
        document.querySelectorAll('a[href*="docs.google.com/forms"]').forEach(function (link) {
            if (link.closest('#bngWarriorsModal')) return;
            link.addEventListener('click', function (e) {
                e.preventDefault();
                openModal();
            });
        });

        injectSharedStyles();
        setupSmsModal();
        setupOpinionModal();
        setupSmsFab();

        // Keep Tab inside each open overlay. Attached after the setup calls
        // above so the SMS and opinion modals actually exist.
        [modal, smsModal, opinionModal].forEach(function (d) {
            if (d) d.addEventListener('keydown', function (e) { trapFocus(d, e); });
        });

        announceFab();
        injectSkipLink();
    }

    function injectSharedStyles() {
        if (document.getElementById('bng-shared-styles')) return;
        var style = document.createElement('style');
        style.id = 'bng-shared-styles';
        style.textContent = SHARED_STYLES.trim();
        document.head.appendChild(style);
    }

    function setupSmsModal() {
        smsModal = document.getElementById('bngSmsModal');
        if (!smsModal) {
            var div = document.createElement('div');
            div.innerHTML = SMS_MODAL_HTML.trim();
            smsModal = div.firstElementChild;
            document.body.appendChild(smsModal);
        }

        smsForm = document.getElementById('bngSmsForm');

        smsModal.querySelectorAll('[data-bng-sms-close]').forEach(function (el) {
            el.addEventListener('click', closeSmsModal);
        });
        smsModal.addEventListener('click', function (e) {
            if (e.target === smsModal) closeSmsModal();
        });
        smsForm.addEventListener('submit', submitSms);

        document.querySelectorAll('.js-open-sms').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                openSmsModal();
            });
        });
    }

    // Every submit button is disabled while its request is in flight and
    // re-enabled afterwards. Without this, a modal that is closed after a
    // successful submit and re-opened keeps the disabled "Submitting..."
    // button and can never be used again without a page reload.
    function setSubmitting(btn, isSubmitting, idleLabel) {
        if (!btn) return;
        btn.disabled = isSubmitting;
        btn.textContent = isSubmitting ? 'Submitting...' : idleLabel;
    }

    function openSmsModal() {
        var successEl = document.getElementById('bngSmsSuccess');
        if (successEl) successEl.classList.add('hidden');
        smsForm.classList.remove('hidden');
        smsForm.reset();
        setSubmitting(document.getElementById('bngSmsSubmit'), false, 'Opt In to SMS Alerts');
        smsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setInitialFocus(smsModal);
    }

    function closeSmsModal() {
        smsModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        restoreFocus(smsModal.__bngTrigger);
    }

    function submitSms(e) {
        e.preventDefault();
        // The form is marked novalidate, so the browser's own required-field
        // checks never fire. Without this the consent box is decorative and
        // empty submissions are accepted.
        if (!smsForm.checkValidity()) {
            smsForm.reportValidity();
            return;
        }

        var payload = {
            list: 'SMS Opt-Ins',
            name: document.getElementById('bngSmsName').value.trim(),
            phone: document.getElementById('bngSmsPhone').value.trim(),
            email: document.getElementById('bngSmsEmail').value.trim(),
            consent: document.getElementById('bngSmsConsent').checked ? 'Yes' : 'No',
            website: document.getElementById('bngSmsWebsite').value.trim()
        };

        // Honeypot first: bail before touching the button so a bot trip cannot
        // leave the form in a permanently disabled state.
        if (payload.website) {
            showSmsSuccess();
            return;
        }

        var btn = document.getElementById('bngSmsSubmit');
        setSubmitting(btn, true);

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(function (res) { return res.json(); }).then(function (data) {
            if (data && data.result === 'success') {
                showSmsSuccess();
            } else {
                setSubmitting(btn, false, 'Opt In to SMS Alerts');
                alert((data && data.error) || 'Something went wrong. Please try again or email submissions.BNG@suso.world');
            }
        }).catch(function () {
            setSubmitting(btn, false, 'Opt In to SMS Alerts');
            alert('Something went wrong. Please try again or email submissions.BNG@suso.world');
        });
    }

    function showSmsSuccess() {
        var successEl = document.getElementById('bngSmsSuccess');
        smsForm.classList.add('hidden');
        successEl.classList.remove('hidden');
    }

    function setupOpinionModal() {
        opinionModal = document.getElementById('bngOpinionModal');
        if (!opinionModal) {
            var div = document.createElement('div');
            div.innerHTML = OPINION_MODAL_HTML.trim();
            opinionModal = div.firstElementChild;
            document.body.appendChild(opinionModal);
        }

        opinionForm = document.getElementById('bngOpinionForm');
        buildPolicyReviewSelect();

        opinionModal.querySelectorAll('[data-bng-opinion-close]').forEach(function (el) {
            el.addEventListener('click', closeOpinionModal);
        });
        opinionModal.addEventListener('click', function (e) {
            if (e.target === opinionModal) closeOpinionModal();
        });
        opinionForm.addEventListener('submit', submitOpinion);

        document.querySelectorAll('.js-open-opinion').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                openOpinionModal();
            });
        });
    }

    function buildPolicyReviewSelect() {
        var select = document.getElementById('bngOpinionReview');
        select.innerHTML = '<option value="">Select a policy review</option>';
        openPolicyOptions().forEach(function (opt) {
            var o = document.createElement('option');
            // opt[0] is the normalised sheet key; opt[1] is the human label.
            // Sending the label would fill the sheet with long, comma-laden
            // strings that are painful to filter or pivot on.
            o.value = opt[0];
            o.textContent = opt[1];
            select.appendChild(o);
        });
    }

    function openOpinionModal() {
        var successEl = document.getElementById('bngOpinionSuccess');
        if (successEl) successEl.classList.add('hidden');
        opinionForm.classList.remove('hidden');
        opinionForm.reset();
        buildPolicyReviewSelect();
        setSubmitting(document.getElementById('bngOpinionSubmit'), false, 'Submit Your View');
        opinionModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setInitialFocus(opinionModal);
    }

    function closeOpinionModal() {
        opinionModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        restoreFocus(opinionModal.__bngTrigger);
    }

    function submitOpinion(e) {
        e.preventDefault();
        if (!opinionForm.checkValidity()) {
            opinionForm.reportValidity();
            return;
        }

        var payload = {
            list: 'Policy Review Submissions',
            name: document.getElementById('bngOpinionName').value.trim(),
            contact: document.getElementById('bngOpinionContact').value.trim(),
            policyReview: document.getElementById('bngOpinionReview').value,
            location: document.getElementById('bngOpinionLocation').value.trim(),
            opinion: document.getElementById('bngOpinionText').value.trim(),
            website: document.getElementById('bngOpinionWebsite').value.trim()
        };

        if (payload.website) {
            showOpinionSuccess();
            return;
        }

        var btn = document.getElementById('bngOpinionSubmit');
        setSubmitting(btn, true);

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(function (res) { return res.json(); }).then(function (data) {
            if (data && data.result === 'success') {
                showOpinionSuccess();
            } else {
                setSubmitting(btn, false, 'Submit Your View');
                alert((data && data.error) || 'Something went wrong. Please try again or email submissions.BNG@suso.world');
            }
        }).catch(function () {
            setSubmitting(btn, false, 'Submit Your View');
            alert('Something went wrong. Please try again or email submissions.BNG@suso.world');
        });
    }

    function showOpinionSuccess() {
        var successEl = document.getElementById('bngOpinionSuccess');
        opinionForm.classList.add('hidden');
        successEl.classList.remove('hidden');
    }

    function setupSmsFab() {
        fabRoot = document.getElementById('bngSmsFab');
        if (!fabRoot) {
            var div = document.createElement('div');
            div.innerHTML = buildSmsFabHtml().trim();
            fabRoot = div.firstElementChild;
            document.body.appendChild(fabRoot);
        }

        fabBubble = document.getElementById('bngSmsFabBubble');
        var close = document.getElementById('bngSmsFabClose');
        var smsCta = document.getElementById('bngSmsFabCta');
        var opinionCta = document.getElementById('bngOpinionFabCta');

        fabBubble.addEventListener('mouseover', function () {
            fabHovered = true;
            clearTimeout(fabCollapseTimer);
            if (fabPinned || fabRoot.classList.contains('expanded')) return;
            clearTimeout(fabHoverTimer);
            fabHoverTimer = setTimeout(function () {
                if (fabRoot.matches(':hover')) expandFab();
            }, FAB_HOVER_DELAY);
        });

        fabRoot.addEventListener('mouseout', function () {
            fabHovered = false;
            clearTimeout(fabHoverTimer);
            clearTimeout(fabCollapseTimer);
            fabCollapseTimer = setTimeout(function () {
                if (!fabPinned && !fabRoot.matches(':hover')) collapseFab();
            }, FAB_COLLAPSE_DELAY);
        });

        fabBubble.addEventListener('click', function () {
            clearTimeout(fabHoverTimer);
            fabPinned = !fabRoot.classList.contains('expanded');
            if (fabPinned) expandFab();
            else { collapseFab(); scheduleFabCycle(); }
        });

        close.addEventListener('click', function () {
            fabPinned = false;
            clearTimeout(fabHoverTimer);
            clearTimeout(fabCollapseTimer);
            collapseFab();
            scheduleFabCycle();
        });

        smsCta.addEventListener('click', openSmsModal);
        opinionCta.addEventListener('click', openOpinionModal);

        scheduleFabCycle();
    }

    function expandFab() {
        fabRoot.classList.add('expanded');
        if (fabBubble) fabBubble.setAttribute('aria-expanded', 'true');
    }

    function collapseFab() {
        fabRoot.classList.remove('expanded');
        if (fabBubble) fabBubble.setAttribute('aria-expanded', 'false');
    }

    function showFab() {
        fabShown = true;
        fabRoot.classList.add('show');
    }

    function hideFab() {
        fabShown = false;
        collapseFab();
        fabPinned = false;
        fabRoot.classList.remove('show');
    }

    function randBetween(a, b) {
        return Math.floor(Math.random() * (b - a + 1)) + a;
    }

    function scheduleFabCycle() {
        clearTimeout(fabTimer);
        fabTimer = setTimeout(function () {
            if (document.hidden || fabHovered || fabPinned) {
                scheduleFabCycle();
                return;
            }
            if (fabShown) {
                hideFab();
            } else {
                showFab();
            }
            scheduleFabCycle();
        }, document.hidden || fabHovered || fabPinned ? randBetween(4000, 7000) : (fabShown ? randBetween(12000, 22000) : randBetween(6000, 14000)));
    }

    function openModal() {
        resetForm();
        goToStep(1);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        setInitialFocus(modal);
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        restoreFocus(modal.__bngTrigger);
    }

    function currentStep() {
        var fs = scrollEl.querySelector('.bng-warrior-step:not(.hidden)');
        return fs ? parseInt(fs.getAttribute('data-step'), 10) : 1;
    }

    function goToStep(n) {
        scrollEl.querySelectorAll('.bng-warrior-step').forEach(function (fs) {
            fs.classList.toggle('hidden', parseInt(fs.getAttribute('data-step'), 10) !== n);
        });

        modal.querySelectorAll('[data-bng-step-dot]').forEach(function (dot) {
            var i = parseInt(dot.getAttribute('data-bng-step-dot'), 10);
            var active = i === n;
            dot.querySelector('.bng-dot').className = 'bng-dot w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center transition-colors ' + (active ? 'bg-brandGreen text-white' : 'bg-gray-200 text-gray-500');
            dot.querySelector('.bng-step-label').className = 'bng-step-label text-[9px] sm:text-[10px] font-bold uppercase tracking-wide transition-colors ' + (active ? 'text-brandGreen' : 'text-gray-400');
        });
        modal.querySelectorAll('[data-bng-step-line]').forEach(function (line) {
            var i = parseInt(line.getAttribute('data-bng-step-line'), 10);
            line.className = 'bng-step-line h-0.5 flex-1 mx-2 rounded transition-colors ' + (i < n ? 'bg-brandGreen' : 'bg-gray-200');
        });

        backBtn.disabled = n === 1;
        backBtn.classList.toggle('opacity-40', n === 1);
        backBtn.classList.toggle('cursor-not-allowed', n === 1);
        nextBtn.textContent = n === steps ? 'Submit Application' : 'Continue';
        scrollEl.scrollTop = 0;
    }

    function validateStep(n) {
        var fs = scrollEl.querySelector('.bng-warrior-step[data-step="' + n + '"]');
        var invalid = null;
        fs.querySelectorAll('[required]').forEach(function (field) {
            if (!field.checkValidity() && invalid === null) invalid = field;
        });
        if (invalid) {
            invalid.focus();
            invalid.reportValidity();
            return false;
        }
        return true;
    }

    function onNext() {
        var step = currentStep();
        if (!validateStep(step)) return;
        if (step < steps) {
            goToStep(step + 1);
        } else {
            submitApplication();
        }
    }

    function onBack() {
        var step = currentStep();
        if (step > 1) goToStep(step - 1);
    }

    function radioValue(name) {
        var checked = document.querySelector('input[name="' + name + '"]:checked');
        return checked ? checked.value : '';
    }

    function submitApplication() {
        var payload = {
            list: 'Bonga Na Gava Warriors',
            website: document.getElementById('bngWebsite').value.trim()
        };

        FIELD_IDS.forEach(function (pair) {
            var el = document.getElementById(pair[0]);
            payload[pair[1]] = el ? el.value.trim() : '';
        });
        RADIO_NAMES.forEach(function (pair) {
            payload[pair[1]] = radioValue(pair[0]);
        });

        if (payload.website) {
            showSuccess();
            return;
        }

        var submitLabel = nextBtn.textContent;
        setSubmitting(nextBtn, true);

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(function (res) { return res.json(); }).then(function (data) {
            if (data && data.result === 'success') {
                showSuccess();
            } else {
                setSubmitting(nextBtn, false, submitLabel);
                alert((data && data.error) || 'Something went wrong. Please try again or email submissions.BNG@suso.world');
            }
        }).catch(function () {
            setSubmitting(nextBtn, false, submitLabel);
            alert('Something went wrong. Please try again or email submissions.BNG@suso.world');
        });
    }

    function showSuccess() {
        var successEl = document.getElementById('bngWarriorsSuccess');
        form.classList.add('hidden');
        successEl.classList.remove('hidden');
        modal.querySelector('#bngProgress').classList.add('hidden');
    }

    function resetForm() {
        if (form) form.reset();
        var successEl = document.getElementById('bngWarriorsSuccess');
        form.classList.remove('hidden');
        successEl.classList.add('hidden');
        modal.querySelector('#bngProgress').classList.remove('hidden');
        if (nextBtn) {
            nextBtn.disabled = false;
            nextBtn.textContent = 'Continue';
        }
    }

    // -------------------------------------------------------------------------
    // Focus management for the three overlays.
    //
    // Each modal already carries role="dialog" and aria-modal="true", but
    // without a focus trap Tab walks straight out into the page behind the
    // overlay, which strands keyboard and screen reader users. These two helpers
    // move focus in on open, keep it inside while open, and return it to the
    // trigger that opened the modal.
    // -------------------------------------------------------------------------
    var FOCUSABLE = [
        'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
        'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function focusableIn(root) {
        return Array.prototype.filter.call(
            root.querySelectorAll(FOCUSABLE),
            function (el) {
                return el.offsetParent !== null || el === document.activeElement;
            }
        );
    }

    function trapFocus(dialog, event) {
        if (event.key !== 'Tab') return;
        var items = focusableIn(dialog);
        if (!items.length) return;
        var first = items[0];
        var last = items[items.length - 1];
        // Wrap in both directions so focus never escapes to the page behind.
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function setInitialFocus(dialog) {
        var items = focusableIn(dialog);
        if (!items.length) return;
        // Prefer the first real field, but never land on the close button as the
        // first stop, since that reads as "this dialog is dismissable".
        var target = items[0];
        for (var i = 0; i < items.length; i++) {
            var tag = items[i].tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                target = items[i];
                break;
            }
        }
        target.focus();
    }

    function restoreFocus(trigger) {
        if (trigger && typeof trigger.focus === 'function') {
            trigger.focus();
        }
    }

    // Most pages were authored with a bare sequence of <section> elements and
    // no <main> landmark at all, which leaves screen reader users with no way
    // to jump past the header nav. Give the page a landmark, then a skip link
    // that targets it. Injected here so all 16 pages stay in step.
    function ensureMainLandmark() {
        var main = document.querySelector('main');
        if (main) {
            if (!main.id) main.id = 'main';
            return main;
        }

        // Wrap everything from the first <section> up to (but not including)
        // the <footer> in a <main>. That range is the page's unique content.
        var body = document.body;
        var kids = Array.prototype.slice.call(body.children);
        var start = kids.findIndex(function (el) {
            return el.tagName === 'SECTION' || el.tagName === 'MAIN';
        });
        if (start === -1) return null;

        var end = kids.length;
        for (var i = start; i < kids.length; i++) {
            if (kids[i].tagName === 'FOOTER') { end = i; break; }
        }

        main = document.createElement('main');
        main.id = 'main';
        var toMove = kids.slice(start, end);
        toMove.forEach(function (el) { main.appendChild(el); });
        body.insertBefore(main, kids[end] || null);
        return main;
    }

    // Applies a skip link to every page from one place. Injected here rather
    // than added to 16 files so it cannot drift between them.
    function injectSkipLink() {
        if (document.querySelector('.bng-skip-link')) return;
        if (!ensureMainLandmark()) return;
        var link = document.createElement('a');
        link.href = '#main';
        link.className = 'bng-skip-link';
        link.textContent = 'Skip to main content';
        document.body.insertBefore(link, document.body.firstChild);
    }

    // The floating SMS panel auto-opens on a timer. An element that appears
    // without user action needs to be announced, otherwise screen reader users
    // have no idea it is there.
    function announceFab() {
        var fab = document.getElementById('bngSmsFab');
        if (!fab) return;
        var live = document.createElement('div');
        live.setAttribute('aria-live', 'polite');
        live.setAttribute('aria-atomic', 'true');
        live.className = 'bng-visually-hidden';
        document.body.appendChild(live);
        fab.__bngLive = live;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
