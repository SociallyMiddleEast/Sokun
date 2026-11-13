/* =============================================================
   SOKUN — EDIT YOUR BUSINESS DETAILS HERE
   Anything left as an empty string '' is simply hidden on the site.
   ============================================================= */
window.SOKUN = {
  name: 'Sokun Wellness Center',

  // Contact — fill these in
  instagram: '',          // e.g. 'sokun.wellness'  (handle only, no @)
  whatsapp: '',           // e.g. '96170123456'     (country code, digits only)
  phone: '',              // e.g. '+961 70 123 456'
  email: '',              // e.g. 'hello@sokun.com'

  address: 'Bikfaya, Metn — Mount Lebanon',
  // What Google Maps should search for (or paste exact "lat,lng")
  mapQuery: 'Bikfaya, Lebanon',

  hours: [
    ['Mon – Fri', '10:00 – 20:00'],
    ['Saturday', '10:00 – 18:00'],
    ['Sunday', 'By appointment'],
  ],

  // Treatments shown in the "Treatments" section
  treatments: [
    { title: 'Massage Therapy', ar: 'تدليك', text: 'Swedish, deep tissue and hot-stone massage to release what the week left in your shoulders.', meta: '60 / 90 min' },
    { title: 'Facials & Skincare', ar: 'عناية بالبشرة', text: 'Cleansing, hydrating and glow facials using gentle, skin-first products.', meta: '45 / 75 min' },
    { title: 'Body Rituals', ar: 'طقوس الجسم', text: 'Scrubs and wraps with Lebanese botanicals — olive, laurel, cedar and rose.', meta: '60 min' },
    { title: 'Yoga & Meditation', ar: 'يوغا وتأمل', text: 'Small-group and private classes to move, stretch and quiet the mind.', meta: 'Group / Private' },
    { title: 'Sauna & Steam', ar: 'ساونا وبخار', text: 'Heat, steam and a cool rinse — the oldest reset there is.', meta: 'Add-on' },
    { title: 'Couples Retreat', ar: 'للثنائي', text: 'Side-by-side treatments followed by tea in the lounge.', meta: '2 hrs' },
  ],

  // Gallery tiles. To use real photos: put them in assets/photos/ and set
  // image: 'assets/photos/your-photo.jpg'. Without an image a soft colour panel is shown.
  gallery: [
    { label: 'Treatment room', image: '', tone: 'stone', wide: true },
    { label: 'The lounge', image: '', tone: 'pine' },
    { label: 'Steam', image: '', tone: 'mist' },
    { label: 'Water & candles', image: '', tone: 'ember' },
    { label: 'Yoga studio', image: '', tone: 'sand' },
  ],

  // Set to false to skip the cinematic intro entirely
  playIntro: true,
};
