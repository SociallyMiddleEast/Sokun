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

  // Classes (section "Classes")
  classes: [
    { title: 'Boxing', ar: 'ملاكمة', text: 'Pads, bags and footwork. Build power, speed and confidence.', meta: 'Cardio · Strength' },
    { title: 'Belly Dance', ar: 'رقص شرقي', text: 'Shimmies, isolations and flow — oriental dance for every body.', meta: 'Dance' },
    { title: 'Mat Pilates', ar: 'بيلاتس', text: 'Core strength, posture and control, one slow breath at a time.', meta: 'Core · Mobility' },
    { title: 'Total Body Burn', ar: 'حرق كامل', text: 'High-energy, full-body conditioning to sweat, sculpt and recharge.', meta: 'HIIT' },
    { title: 'Salsa', ar: 'سالسا', text: 'Learn the steps, feel the rhythm, and leave smiling.', meta: 'Dance' },
    { title: 'Hip Hop', ar: 'هيب هوب', text: 'Grooves, choreography and attitude.', meta: 'Dance' },
    { title: 'Yoga', ar: 'يوغا', text: 'Breath, balance and flexibility — the stillness in Sokun.', meta: 'Mind · Body' },
    { title: 'Gymnastics', ar: 'جمباز', text: 'Flexibility, strength and body control, step by step.', meta: 'Skills' },
  ],

  // Gallery tiles. To use real photos: put them in assets/photos/ and set
  // image: 'assets/photos/your-photo.jpg'. Without an image a soft colour panel is shown.
  gallery: [
    { label: 'The studio', image: '', tone: 'stone', wide: true },
    { label: 'Boxing corner', image: '', tone: 'ember' },
    { label: 'Mat Pilates', image: '', tone: 'sand' },
    { label: 'Dance floor', image: '', tone: 'mist' },
    { label: 'Diet clinic', image: '', tone: 'pine' },
  ],

  // Optional: a real filmed walk-in (street → building → studio). If you add the file,
  // it plays instead of the 3D intro, e.g. introVideo: 'assets/intro.mp4'
  introVideo: '',

  // Set to false to skip the intro entirely
  playIntro: true,
};
