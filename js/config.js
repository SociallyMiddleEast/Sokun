/* =============================================================
   SOKUN — EDIT YOUR BUSINESS DETAILS HERE
   Anything left as an empty string '' (or empty list) is simply hidden on the site.
   ============================================================= */
window.SOKUN = {
  name: 'Sokun Wellness Center',

  // Contact — fill these in
  instagram: '',          // e.g. 'sokun.wellness'  (handle only, no @)
  whatsapp: '',           // e.g. '96170123456'     (country code, digits only)
  phone: '',              // e.g. '+961 70 123 456'
  email: '',              // e.g. 'hello@sokun.com'

  address: 'Bikfaya Main Street (Antelias – Bikfaya Rd), 1st floor — above BLOM Bank',
  // Map pin: BLOM Bank Bikfaya building (from Google Maps)
  mapQuery: '33.9189946,35.677801',

  // Opening hours — leave empty to show "ask us for the weekly timetable"
  hours: [
    // ['Mon – Fri', '08:00 – 21:00'],
    // ['Saturday', '09:00 – 14:00'],
  ],

  // Classes, grouped (section "Classes")
  classGroups: [
    { title: 'Fitness & Strength', ar: 'لياقة وقوة', classes: [
      { title: 'Functional', ar: 'تدريب وظيفي', text: 'Real-life movements that build strength, balance and mobility.' },
      { title: 'Total Body Burn', ar: 'حرق كامل', text: 'High-energy, full-body conditioning to sweat and sculpt.' },
      { title: 'Fitness & Boxing', ar: 'لياقة وملاكمة', text: 'Cardio and strength mixed with pads, bags and footwork.' },
      { title: 'Girls Boxing', ar: 'ملاكمة للبنات', text: 'Boxing technique and conditioning in a women-only class.' },
      { title: 'Abs & Glutes', ar: 'بطن وأرداف', text: 'Focused core and lower-body sculpting.' },
      { title: 'Lift & Sculpt', ar: 'رفع ونحت', text: 'Weights and controlled reps to tone and strengthen.' },
      { title: 'Cross Fit', ar: 'كروس فيت', text: 'Varied, intense functional workouts — every class is different.' },
      { title: 'TRX × Trampoline', ar: 'TRX وترامبولين', text: 'Suspension training meets rebounding cardio.' },
      { title: 'PT Sessions', ar: 'تدريب شخصي', text: 'One-on-one coaching built entirely around your goals.' },
    ]},
    { title: 'Pilates & Mind-Body', ar: 'بيلاتس وتوازن', classes: [
      { title: 'Reformer', ar: 'ريفورمر', text: 'Machine-based Pilates for deep core strength and long, lean muscle.' },
      { title: 'Mat Pilates', ar: 'بيلاتس أرضي', text: 'Core, posture and control on the mat.' },
      { title: 'Yoga', ar: 'يوغا', text: 'Breath, balance and flexibility — the stillness in Sokun.' },
      { title: 'Aerial Yoga', ar: 'يوغا هوائية', text: 'Yoga in a suspended hammock — strength, stretch and fun.' },
    ]},
    { title: 'Dance', ar: 'رقص', classes: [
      { title: 'Belly Dance', ar: 'رقص شرقي', text: 'Shimmies, isolations and flow — oriental dance for every body.' },
      { title: 'Salsa', ar: 'سالسا', text: 'Learn the steps, feel the rhythm, leave smiling.' },
      { title: 'Zumba', ar: 'زومبا', text: 'A dance-fitness party you won\'t want to end.' },
      { title: 'Hip Hop', ar: 'هيب هوب', text: 'Grooves, choreography and attitude.' },
      { title: 'Dabke', ar: 'دبكة', text: 'Lebanon\'s own folk dance — stamp, link arms and celebrate.' },
    ]},
    { title: 'Kids & Gymnastics', ar: 'أطفال وجمباز', classes: [
      { title: 'Kids Gymnastics', ar: 'جمباز أطفال', text: 'Flexibility, strength and confidence through play.' },
      { title: 'Fly Gymnastics', ar: 'جمباز طيران', text: 'Flips, jumps and airborne skills, step by step.' },
      { title: 'Kid Fit Boxing', ar: 'ملاكمة أطفال', text: 'Fitness and boxing basics for kids — focus, discipline, energy.' },
    ]},
  ],

  // Pricing (USD). Each row: [label, number of sessions, price]
  currency: '$',
  pricing: [
    { title: 'Class Packages', ar: 'باقات الحصص', featured: true,
      note: 'Access to Boxing, Belly Dance, Mat Pilates, Total Body Burn, Salsa, Hip Hop, Yoga and Gymnastics.',
      groups: [{ rows: [['Single class', 1, 15], ['4 sessions', 4, 55], ['8 sessions', 8, 90], ['12 sessions', 12, 126]] }] },
    { title: 'Reformer Pilates', ar: 'بيلاتس ريفورمر',
      groups: [{ rows: [['Single class', 1, 20], ['4 sessions', 4, 75], ['8 sessions', 8, 140], ['12 sessions', 12, 200]] }] },
    { title: 'One-on-One PT', ar: 'تدريب شخصي',
      groups: [{ rows: [['Single session', 1, 35], ['8 sessions', 8, 240], ['12 sessions', 12, 300]] }] },
    { title: 'Dance Packages', ar: 'باقات الرقص',
      groups: [
        { name: 'Belly Dance', rows: [['Single session', 1, 15], ['4 sessions', 4, 50]] },
        { name: 'Salsa', rows: [['Single session', 1, 15], ['4 sessions', 4, 50]] },
        { name: 'Zumba', rows: [['Single class', 1, 15], ['4 sessions', 4, 50]] },
      ] },
    { title: 'Kids Packages', ar: 'باقات الأطفال', wide: true,
      groups: [
        { name: 'Hip Hop', rows: [['Single', 1, 15], ['4 sessions', 4, 50]] },
        { name: 'Gymnastics', rows: [['Single session', 1, 15], ['4 sessions', 4, 50]] },
        { name: 'Boxing', rows: [['Single class', 1, 15], ['4 sessions', 4, 50], ['Private session', 1, 25]] },
        { name: 'Aerial', rows: [['Single class', 1, 20], ['4 sessions', 4, 70]] },
      ] },
  ],

  // Gallery tiles. To use real photos: put them in assets/photos/ and set
  // image: 'assets/photos/your-photo.jpg'. Without an image a soft colour panel is shown.
  gallery: [
    { label: 'The studio', image: '', tone: 'stone', wide: true },
    { label: 'Boxing corner', image: '', tone: 'ember' },
    { label: 'Reformer & Pilates', image: '', tone: 'sand' },
    { label: 'Dance floor', image: '', tone: 'mist' },
    { label: 'Diet clinic', image: '', tone: 'pine' },
  ],

  // Optional: a real filmed walk-in (street → building → studio). If you add the file,
  // it plays instead of the 3D intro, e.g. introVideo: 'assets/intro.mp4'
  introVideo: '',

  // Set to false to skip the intro entirely
  playIntro: true,
};
