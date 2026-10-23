// Reusable answers to recurring project questions. Individual city briefs and
// preparation lists live in additional-services-{state}.js.
module.exports = {
  lead: {
    paint: ['Does a result from one painted component cover the room?', 'The report should identify the particular components and samples assessed. Describe different finishes and repair histories so an untested surface is not assumed to match the sampled one.'],
    water: ['What should I provide for a drinking-water question?', 'Identify the outlet, plumbing changes, prior results, and how the water is used. Confirm the collection instructions for the chosen analysis rather than improvising a sample procedure.'],
    dust: ['Does a paint result answer a question about settled dust?', 'They describe different samples. Explain the dust concern and affected surfaces so any dust sampling has its own locations, method, and reporting scope.'],
    previous: ['Can an earlier lead report be used for this project?', 'Provide the complete report with sample locations and limitations. Compare its scope with the current materials and work area before relying on it for a new decision.'],
    renovation: ['When should testing be discussed during renovation planning?', 'Discuss the materials and planned disturbance before contractors begin. Share changes to the work area so the sampling and report can address the current project.'],
    purchase: ['How should a buyer describe the testing request?', 'Identify the concern, decision deadline, access arrangements, and written report requirements. A limited test should not be presented as a comprehensive assessment of the entire property.'],
    access: ['What if the component or room cannot be accessed?', 'Identify that restriction before booking. Agree what can be assessed and make sure the report records uninspected areas rather than implying complete coverage.'],
    multiple: ['Can several buildings or units share one sampling description?', 'Label each location and its materials separately. Similar appearance or ownership does not establish that the installations match; the report needs traceable sample locations.'],
    preserve: ['How do I explain finishes that must remain intact?', 'Identify the protected features and who can authorize sampling. Discuss access and disturbance limits before the visit so the proposed procedure fits the preservation plan.'],
    documents: ['What if another organization needs a specific lead document?', 'Supply its written requirements first. Confirm the required scope and credentials; a limited sample report may not meet a formal inspection, risk-assessment, or clearance requirement.']
  },
  radon: {
    occupied: ['Can the building remain occupied during testing?', 'Discuss normal use and the testing instructions with the provider. Coordinate occupants so access, device placement, and agreed conditions can be maintained and any interruptions recorded.'],
    deadline: ['What dates matter when planning around a deadline?', 'Allow time for placement, the agreed monitoring period, completion, and reporting. Share the actual decision date before booking so the schedule can be confirmed.'],
    previous: ['What makes an earlier radon report useful?', 'Bring the measurement dates, room locations, test duration, and recorded conditions. Explain building changes since then so the provider can decide how the earlier result relates to the current question.'],
    conversion: ['Should a newly occupied room be mentioned?', 'Yes. Explain its former and intended uses and where people will spend time. That information helps define the measurement locations and the decision the test should support.'],
    access: ['Who needs access while the measurement is arranged?', 'Agree who can admit the provider, coordinate occupants, and protect the device from disturbance. Plan placement and completion access before assuming an appointment can fit a narrow window.'],
    multiple: ['Does one measurement represent every unit or building?', 'Do not assume that it does. Describe the layout, occupied spaces, and separate structures so the provider can explain the scope and the locations each result represents.'],
    system: ['Should I mention an existing radon system?', 'Yes. Provide installation or service records and previous test reports. Discuss the system and building operation with the provider when arranging the measurement conditions.'],
    vacant: ['What should be documented for an empty property?', 'Record vacancy dates, recent work, building operation, and who controls access. Agree the testing instructions before placement and note changes during the measurement period.'],
    change: ['What if building conditions change during the test?', 'Record the timing and nature of the change and contact the provider. The applicable procedure determines whether the result remains usable or whether another measurement is needed.'],
    layout: ['Why describe different levels and foundations?', 'The layout helps define the areas involved in your decision. Identify additions, separate lower spaces, and intended room use so placement and reporting boundaries are clear.']
  },
  'indoor-air-quality': {
    intermittent: ['What if the concern is intermittent?', 'Keep a dated log of rooms, activities, and system operation when it occurs. Those records help select a useful observation window even when conditions differ during the first visit.'],
    products: ['Should recent products and finishes be listed?', 'Yes. Note installation or use dates, locations, and ventilation changes. The investigation should consider those details alongside other building observations rather than assume a cause.'],
    moisture: ['Does every indoor-air concern call for mold sampling?', 'No. Describe water history as well as activities, products, and ventilation. The consultation can determine whether a mold question or another investigation is the useful starting point.'],
    shared: ['How are shared building systems handled?', 'Identify the occupied spaces, management contact, and access to relevant shared areas. The report should distinguish observed conditions from systems or rooms that were not assessed.'],
    occupancy: ['Why record occupancy and operating hours?', 'They show the conditions under which the concern occurs. Changes in people, activities, and equipment use can help define the investigation and interpret observations.'],
    renovation: ['What should I document after a renovation?', 'Keep the sequence of work, products used, ventilation changes, and when rooms became occupied. Describe whether the concern predates the project or began afterward.'],
    records: ['Which records are useful before an air-quality visit?', 'Supply relevant maintenance, water-event, ventilation, and previous testing records. Keep their dates and locations attached so they can be compared with the current observations.'],
    rooms: ['Should unaffected rooms be mentioned too?', 'Yes. Describe where the concern is and is not observed. That comparison helps define boundaries and avoid treating every room as if it operates the same way.'],
    workshop: ['Can an odor from work activities be assumed to be mold?', 'No. Explain activities, products, ventilation connections, and moisture observations separately. The proposed assessment should address the actual question rather than default to one test.'],
    ventilation: ['What should I explain about ventilation changes?', 'Describe how the rooms operated before and after the change, including connected spaces and system schedules. Those details help interpret the observed conditions without assuming the equipment change proves the cause.']
  },
  'commercial-industrial': {
    phases: ['How should a phased project be described?', 'Name each work area, visit window, and decision date. Agree how reports will identify the areas assessed in each phase and any portions awaiting access or further work.'],
    tenant: ['Does a tenant inspection include common areas?', 'Only where they are part of the agreed scope and accessible. Identify ownership and access responsibilities before booking so shared areas are not assumed to have been assessed.'],
    occupied: ['Can testing be planned around normal operations?', 'Provide the operating schedule and restrictions. Discuss which conditions the investigation needs to observe and how visits can be coordinated without losing the context of the concern.'],
    handover: ['What matters when a property changes hands or tenants?', 'Keep the outgoing condition records, planned alterations, and incoming use separate. Identify who needs the report and which decision or deadline it must support.'],
    portfolio: ['Can one site’s findings describe the whole portfolio?', 'No. Keep property, building, room, and sample identifiers distinct. Shared ownership does not make different installations or operating conditions equivalent.'],
    school: ['What should a school or regulated-project request include?', 'Provide the applicable written requirements, project roles, deliverables, and timing. Confirm the necessary qualifications and A1’s specific role before treating a general testing quote as acceptance of a regulated assignment.'],
    records: ['How should previous reports be supplied?', 'Send complete reports with dates, locations, methods, and limitations. Explain changes since the earlier work so the current inspection can address the new question and work boundaries.'],
    scope: ['What belongs in the commercial testing scope?', 'Identify the question, spaces, activities, materials, methods, access limits, and intended report use. Confirm any required standard and acceptance criteria before work begins.'],
    access: ['How are inaccessible facility areas handled?', 'Name them in advance and identify who can authorize entry. The report should state its inspection limits; locked or restricted rooms should not be implied to be covered.'],
    process: ['Is a general indoor-air visit an occupational exposure study?', 'Not automatically. A task- or substance-specific workplace question needs an appropriate separate scope, methods, and qualifications. Describe the process and required decision before booking.']
  }
};
