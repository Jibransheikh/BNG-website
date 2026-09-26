(function () {
    'use strict';

    var SHEET_URL = 'https://script.google.com/macros/s/AKfycbzfrMNUkF1ugLtuIYsxTFf5b-3ZzsrOLHbRq6X4RUJe3AOSzUUAuoWnzM_SHz3ADbhw/exec';
    var GFORM_URL = 'https://docs.google.com/forms/u/3/d/e/1FAIpQLScoBESmtB9YkXkxAiE0wGY2_HjoV2o0kEdQqY5Thl1c0xKZPg/viewform';

    // Add every new policy review here and it will automatically show in the
    // "Submit Your View" dropdown. First value is the sheet-friendly key, second
    // is what users see in the dropdown.
    var POLICY_REVIEW_OPTIONS = [
        ['civic education 2026', 'Civic Education, Citizen Engagement & Public Participation Policy 2026'],
        ['wildlife conservation bill 2025', 'The Wildlife Conservation & Management Bill, 2025'],
        ['public participation bill 2024', 'The Kenya Public Participation Bill, 2024'],
        ['public participation bill 2025', 'The Public Participation Bill, 2025']
    ];

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
    right: 1.25rem;
    bottom: 1.25rem;
    z-index: 80;
    display: none;
    flex-direction: column;
    align-items: flex-end;
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
    transform-origin: bottom right;
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
.bng-fab-note {
    font-size: 0.8rem;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 1rem;
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
}`;

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
            <h4>How BNG SMS works</h4>
            <img src="` + IMG_BASE + `assets/images/how_bng_sms.jpeg" alt="How BNG SMS works" class="bng-fab-img">
            <h4>Why BNG SMS</h4>
            <img src="` + IMG_BASE + `assets/images/why_bng_sms.jpeg" alt="Why BNG SMS" class="bng-fab-img">
            <p class="bng-fab-note">We text you the moment new bills, policies or reviews drop. Then reply straight from your phone with your views. No forms, no spam.</p>
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

        document.querySelectorAll('a[href*="docs.google.com/forms"]').forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                openModal();
            });
        });

        injectSharedStyles();
        setupSmsModal();
        setupOpinionModal();
        setupEmbeddedForms();
        setupSmsFab();
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

    function openSmsModal() {
        var successEl = document.getElementById('bngSmsSuccess');
        if (successEl) successEl.classList.add('hidden');
        smsForm.classList.remove('hidden');
        smsForm.reset();
        smsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeSmsModal() {
        smsModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    function submitSms(e) {
        e.preventDefault();
        var btn = document.getElementById('bngSmsSubmit');
        var original = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        var payload = {
            list: 'SMS Opt-Ins',
            name: document.getElementById('bngSmsName').value,
            phone: document.getElementById('bngSmsPhone').value,
            email: document.getElementById('bngSmsEmail').value.trim() || '',
            consent: document.getElementById('bngSmsConsent').checked ? 'Yes' : 'No',
            website: document.getElementById('bngSmsWebsite').value
        };

        if (payload.website) {
            showSmsSuccess();
            return;
        }

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(function () {
            showSmsSuccess();
        }).catch(function () {
            btn.disabled = false;
            btn.textContent = original;
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
        POLICY_REVIEW_OPTIONS.forEach(function (opt) {
            var o = document.createElement('option');
            o.value = opt[1];
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
        opinionModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeOpinionModal() {
        opinionModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    function submitOpinion(e) {
        e.preventDefault();
        if (!opinionForm.checkValidity()) {
            opinionForm.reportValidity();
            return;
        }
        var btn = document.getElementById('bngOpinionSubmit');
        var original = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Submitting...';

        var payload = {
            list: 'Policy Review Submissions',
            name: document.getElementById('bngOpinionName').value,
            contact: document.getElementById('bngOpinionContact').value,
            policyReview: document.getElementById('bngOpinionReview').value,
            location: document.getElementById('bngOpinionLocation').value,
            opinion: document.getElementById('bngOpinionText').value,
            website: document.getElementById('bngOpinionWebsite').value
        };

        if (payload.website) {
            showOpinionSuccess();
            return;
        }

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(function () {
            showOpinionSuccess();
        }).catch(function () {
            btn.disabled = false;
            btn.textContent = original;
            alert('Something went wrong. Please try again or email submissions.BNG@suso.world');
        });
    }

    function showOpinionSuccess() {
        var successEl = document.getElementById('bngOpinionSuccess');
        opinionForm.classList.add('hidden');
        successEl.classList.remove('hidden');
    }

    function setupEmbeddedForms() {
        document.querySelectorAll('form[data-bng-kind]').forEach(function (form) {
            if (form.getAttribute('data-bng-bound')) return;
            form.setAttribute('data-bng-bound', '1');

            var select = form.querySelector('[data-bng-policy-select]');
            if (select) {
                var preset = form.getAttribute('data-bng-policy-default') || '';
                select.innerHTML = '<option value="">Select a policy review</option>';
                POLICY_REVIEW_OPTIONS.forEach(function (opt) {
                    var o = document.createElement('option');
                    o.value = opt[1];
                    o.textContent = opt[1];
                    if (preset && opt[1] === preset) o.selected = true;
                    select.appendChild(o);
                });
                if (preset) select.value = preset;
            }

            form.addEventListener('submit', function (e) {
                e.preventDefault();
                submitEmbeddedForm(form);
            });
        });
    }

    function submitEmbeddedForm(form) {
        var kind = form.getAttribute('data-bng-kind');
        var data = {};
        form.querySelectorAll('[data-bng-field]').forEach(function (el) {
            var key = el.getAttribute('name');
            if (!key) return;
            if (el.type === 'checkbox') data[key] = el.checked ? 'Yes' : 'No';
            else data[key] = el.type === 'email' ? el.value.trim() : el.value;
        });

        var btn = form.querySelector('button[type="submit"]');
        var original = btn ? btn.textContent : '';
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Submitting...';
        }

        var payload;
        if (kind === 'sms') {
            payload = {
                list: 'SMS Opt-Ins',
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
                consent: data.consent || 'No',
                website: data.website || ''
            };
        } else {
            payload = {
                list: 'Policy Review Submissions',
                name: data.name || '',
                contact: data.contact || '',
                policyReview: data.policyReview || form.getAttribute('data-bng-policy-default') || '',
                location: data.location || '',
                opinion: data.opinion || '',
                website: data.website || ''
            };
        }

        function done() {
            form.classList.add('hidden');
            var success = form.nextElementSibling;
            if (success && success.hasAttribute && success.hasAttribute('data-bng-success')) {
                success.classList.add('show');
            }
        }

        if (payload.website) { done(); return; }

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(done).catch(function () {
            if (btn) {
                btn.disabled = false;
                btn.textContent = original;
            }
            alert('Something went wrong. Please try again or email submissions.BNG@suso.world');
        });
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

        fabRoot.addEventListener('mouseenter', function () {
            fabHovered = true;
            expandFab();
        });
        fabRoot.addEventListener('mouseleave', function () {
            fabHovered = false;
            setTimeout(function () {
                if (!fabHovered && !fabPinned) collapseFab();
            }, 350);
        });

        fabBubble.addEventListener('click', function () {
            fabPinned = !fabRoot.classList.contains('expanded');
            if (fabPinned) expandFab();
            else { collapseFab(); scheduleFabCycle(); }
        });

        close.addEventListener('click', function () {
            fabPinned = false;
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
    }

    function closeModal() {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
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
        var submitLabel = nextBtn.textContent;
        nextBtn.disabled = true;
        nextBtn.textContent = 'Submitting...';

        var payload = {
            list: 'Bonga Na Gava Warriors',
            website: document.getElementById('bngWebsite').value
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

        fetch(SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        }).then(function () {
            showSuccess();
        }).catch(function () {
            nextBtn.disabled = false;
            nextBtn.textContent = submitLabel;
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();