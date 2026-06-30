import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const CATEGORIES = [
  { name: "Cameras", icon: "Camera", slug: "cameras" },
  { name: "Speakers", icon: "Speaker", slug: "speakers" },
  { name: "Projectors", icon: "Projector", slug: "projectors" },
  { name: "Lighting", icon: "Lightbulb", slug: "lighting" },
  { name: "Microphones", icon: "Mic", slug: "microphones" },
  { name: "LED Walls", icon: "Monitor", slug: "led-walls" },
  { name: "Furniture", icon: "Armchair", slug: "furniture" },
  { name: "Tents & Canopies", icon: "Tent", slug: "tents" },
  { name: "Decoration", icon: "Sparkles", slug: "decoration" },
  { name: "Stage Equipment", icon: "Clapperboard", slug: "stage-equipment" },
];

const VENDORS = [
  { name: "ProGear Rentals", email: "progear@rentwise.ai", desc: "Premium event equipment rentals with 10+ years experience" },
  { name: "SoundWave Audio", email: "soundwave@rentwise.ai", desc: "Professional audio equipment for events of all sizes" },
  { name: "LightCraft Studios", email: "lightcraft@rentwise.ai", desc: "Studio-grade lighting and photography equipment" },
  { name: "EventMax Solutions", email: "eventmax@rentwise.ai", desc: "One-stop solution for all event equipment needs" },
  { name: "TechRent Hub", email: "techrent@rentwise.ai", desc: "Latest technology and AV equipment on rent" },
  { name: "BrightStage Rentals", email: "brightstage@rentwise.ai", desc: "Stage setups, LED walls, and event infrastructure" },
  { name: "CityFurniture Hire", email: "cityfurniture@rentwise.ai", desc: "Elegant furniture for weddings, parties, and corporate events" },
  { name: "CaptureEquip", email: "capture@rentwise.ai", desc: "DSLRs, lenses, gimbals, and camera accessories" },
];

const PRODUCT_TEMPLATES: Record<string, { title: string; desc: string; features: string[]; buyMin: number; buyMax: number; rentMin: number; rentMax: number; condition: string }[]> = {
  cameras: [
    { title: "Canon EOS R5", desc: "Professional 45MP full-frame mirrorless camera with 8K video recording capabilities. Ideal for weddings, events, and commercial shoots.", features: ["45MP Full-Frame Sensor", "8K RAW Video", "In-Body IS", "Dual CFexpress Slots", "Weather Sealed"], buyMin: 250000, buyMax: 320000, rentMin: 2500, rentMax: 4000, condition: "LIKE_NEW" },
    { title: "Sony A7 IV", desc: "Versatile 33MP full-frame hybrid camera with advanced AI autofocus. Perfect for both photography and videography.", features: ["33MP Sensor", "4K 60p Video", "AI Autofocus", "10fps Burst", "Flip Screen"], buyMin: 180000, buyMax: 220000, rentMin: 2000, rentMax: 3000, condition: "GOOD" },
    { title: "Nikon Z6 III", desc: "Pro-grade 24.5MP mirrorless with exceptional low-light performance. Great for event and concert photography.", features: ["24.5MP Sensor", "6K Video", "EXPEED 7", "493 AF Points", "Dual Card Slots"], buyMin: 195000, buyMax: 240000, rentMin: 2200, rentMax: 3200, condition: "LIKE_NEW" },
    { title: "Canon EOS R6 Mark II", desc: "High-speed 24.2MP mirrorless with incredible autofocus tracking. Ideal for sports and wildlife.", features: ["24.2MP Sensor", "40fps Electronic", "6K ProRes", "Advanced AF", "5-Axis IS"], buyMin: 160000, buyMax: 200000, rentMin: 1800, rentMax: 2800, condition: "GOOD" },
    { title: "Sony FX3 Cinema Camera", desc: "Compact cinema camera designed for filmmakers. Exceptional low-light and 4K 120p recording.", features: ["10.1MP Full-Frame", "4K 120p", "Cinematic Colors", "Active Cooling", "XLR Audio"], buyMin: 350000, buyMax: 420000, rentMin: 4500, rentMax: 6000, condition: "NEW" },
  ],
  speakers: [
    { title: "JBL VTX A12 Line Array", desc: "Professional line array speaker system for large venues and outdoor events. Crystal clear sound at any volume.", features: ["1200W per cabinet", "Line Array Design", "Rigging Hardware", "Weather Resistant", "DSP Built-in"], buyMin: 450000, buyMax: 550000, rentMin: 8000, rentMax: 12000, condition: "GOOD" },
    { title: "Bose L1 Pro32 Portable", desc: "Portable line array system with deep bass and wide coverage. Perfect for mid-size events and performances.", features: ["132 Drivers", "Built-in Sub", "Bass Module", "Lightweight", "Bluetooth Input"], buyMin: 120000, buyMax: 150000, rentMin: 3000, rentMax: 5000, condition: "LIKE_NEW" },
    { title: "QSC KLA12 Active Speaker", desc: "Fixed-arcuation active line array element. Ideal for corporate events, conferences, and live performances.", features: ["500W Class D", "12\" LF Driver", "Passive Rigging", "90° x 18° Coverage", "Lightweight"], buyMin: 85000, buyMax: 110000, rentMin: 2000, rentMax: 3500, condition: "GOOD" },
    { title: "JBL EON715 Powered Speaker", desc: "Versatile 15\" powered speaker with Bluetooth. Great for DJ setups, announcements, and small events.", features: ["1300W Power", "15\" Woofer", "Bluetooth 5.0", "DSP Processing", "Lightweight"], buyMin: 55000, buyMax: 70000, rentMin: 1200, rentMax: 2000, condition: "GOOD" },
    { title: "SubZero SZP-18S Subwoofer", desc: "Powerful 18\" subwoofer for adding deep bass to any sound system. Essential for music events and parties.", features: ["18\" Driver", "1200W RMS", "Front Ported", "Pole Mount", "XLR Input"], buyMin: 65000, buyMax: 80000, rentMin: 1500, rentMax: 2500, condition: "FAIR" },
  ],
  projectors: [
    { title: "Epson EB-L200F Laser Projector", desc: "4K laser projector with 4500 lumens. Perfect for presentations, movie nights, and outdoor screenings.", features: ["4500 Lumens", "4K Resolution", "Laser Light Source", "20,000hr Life", "HDMI & USB-C"], buyMin: 280000, buyMax: 350000, rentMin: 4000, rentMax: 6000, condition: "LIKE_NEW" },
    { title: "BenQ W2700i 4K Projector", desc: "Cinematic 4K HDR projector with Android TV built-in. Ideal for home theater and premium events.", features: ["4K UHD", "2400 Lumens", "HDR-PRO", "Android TV", "CinemaMaster"], buyMin: 190000, buyMax: 240000, rentMin: 2500, rentMax: 4000, condition: "GOOD" },
    { title: "ViewSonic PX747-4K", desc: "Budget-friendly 4K projector with bright 3500 lumens output. Great for conferences and classrooms.", features: ["3500 Lumens", "4K UHD", "Ultra Short Throw", "10W Speaker", "Multiple HDMI"], buyMin: 95000, buyMax: 120000, rentMin: 1500, rentMax: 2500, condition: "GOOD" },
  ],
  lighting: [
    { title: "ARRI SkyPanel S60-C LED", desc: "Professional RGBW LED panel with full-spectrum color control. Industry standard for film and premium events.", features: ["Full Color RGBW", "540W LED", "DMX Control", "High CRI 95+", "Silent Fan"], buyMin: 420000, buyMax: 500000, rentMin: 5000, rentMax: 8000, condition: "LIKE_NEW" },
    { title: "Godox VL300 LED Spotlight", desc: "Powerful 300W LED spotlight with Bowens mount. Perfect for stage lighting and portrait photography.", features: ["300W LED", "5600K Daylight", "Bowens Mount", "DMX Control", "Wireless Remote"], buyMin: 45000, buyMax: 60000, rentMin: 1000, rentMax: 1800, condition: "GOOD" },
    { title: "Chauvet DJ SlimPAR Pro Haze", desc: "Compact LED wash light with haze effect. Ideal for creating ambient lighting at events and parties.", features: ["12x 12W LEDs", "RGBW", "DMX Control", "Haze Mode", "Low Power"], buyMin: 22000, buyMax: 30000, rentMin: 500, rentMax: 900, condition: "GOOD" },
    { title: "Nanlite Forza 500B II", desc: "Bi-color 500W LED monolight with exceptional color accuracy. Professional studio and event lighting.", features: ["500W Bi-Color", "2700-6500K", "CRI 96+", "Bowens Mount", "App Control"], buyMin: 85000, buyMax: 105000, rentMin: 1500, rentMax: 2500, condition: "NEW" },
  ],
  microphones: [
    { title: "Shure SM58 Dynamic Mic", desc: "The industry standard vocal microphone. Legendary for its durability and clear sound. Perfect for live performances.", features: ["Dynamic Capsule", "50Hz-15kHz", "Cardioid Pattern", "Rugged Build", "Pneumatic Shock Mount"], buyMin: 8500, buyMax: 11000, rentMin: 200, rentMax: 400, condition: "GOOD" },
    { title: "Sennheiser EW 500 G4 Wireless", desc: "Professional wireless microphone system with exceptional audio quality. Ideal for presentations and events.", features: ["True Diversity", "1680 Frequencies", "50m Range", "Ethernet Control", "LCD Display"], buyMin: 95000, buyMax: 120000, rentMin: 2500, rentMax: 4000, condition: "LIKE_NEW" },
    { title: "Rode NTG5 Shotgun Mic", desc: "Lightweight broadcast-grade shotgun microphone. Perfect for film production and outdoor events.", features: ["Broadcast Grade", "Super Cardioid", "Low Noise", "Lightweight", "RF Bias"], buyMin: 28000, buyMax: 35000, rentMin: 600, rentMax: 1000, condition: "GOOD" },
    { title: "Audio-Technica AT2020 Condenser", desc: "Studio-quality condenser microphone at an accessible price. Great for recording and streaming.", features: ["Cardioid Condenser", "20Hz-20kHz", "High SPL", "Rugged Build", "XLR Output"], buyMin: 7500, buyMax: 9500, rentMin: 150, rentMax: 300, condition: "LIKE_NEW" },
  ],
  "led-walls": [
    { title: "P3.9 Indoor LED Panel (500x500mm)", desc: "High-resolution indoor LED display panel. Create stunning video walls for events and exhibitions.", features: ["P3.9mm Pitch", "500x500mm", "500x500 Nits", "16-bit Color", "Easy Installation"], buyMin: 35000, buyMax: 45000, rentMin: 1500, rentMax: 2500, condition: "GOOD" },
    { title: "P2.6 Fine Pixel LED Panel", desc: "Ultra-fine pixel pitch LED panel for close-viewing applications. Crisp image quality at any distance.", features: ["P2.6mm Pitch", "600x337.5mm", "600 Nits", "HDR Support", "Lightweight"], buyMin: 55000, buyMax: 70000, rentMin: 2000, rentMax: 3500, condition: "LIKE_NEW" },
    { title: "Outdoor P5 LED Display Panel", desc: "Weatherproof outdoor LED panel with high brightness. Perfect for outdoor events and advertising.", features: ["P5mm Pitch", "640x640mm", "6500 Nits", "IP65 Rated", "Wide Viewing Angle"], buyMin: 45000, buyMax: 58000, rentMin: 1800, rentMax: 3000, condition: "GOOD" },
  ],
  furniture: [
    { title: "Chiavari Chair (Gold)", desc: "Elegant gold Chiavari chair, perfect for weddings and formal events. Comes with cushion.", features: ["Solid Wood", "Gold Finish", "Cushion Included", "Stackable", "350lb Capacity"], buyMin: 4500, buyMax: 6000, rentMin: 80, rentMax: 150, condition: "GOOD" },
    { title: "Round Banquet Table (6ft)", desc: "6-foot round banquet table seating 8-10 guests. Standard for wedding receptions and dinners.", features: ["72\" Diameter", "Seats 8-10", "Folding Legs", "Steel Frame", "Scratch Resistant"], buyMin: 12000, buyMax: 16000, rentMin: 200, rentMax: 400, condition: "GOOD" },
    { title: "Cocktail High-Top Table", desc: "Modern high-top cocktail table for networking events and cocktail parties. Adjustable height.", features: ["Adjustable Height", "30\" Round Top", "Steel Base", "Folding", "Modern Design"], buyMin: 8000, buyMax: 11000, rentMin: 150, rentMax: 300, condition: "LIKE_NEW" },
    { title: "Tiffany Chair (White)", desc: "Classic white Tiffany chair with elegant spindled back. A favorite for garden and beach weddings.", features: ["Solid Wood", "White Finish", "Spindled Back", "Cushion Included", "Lightweight"], buyMin: 3800, buyMax: 5000, rentMin: 70, rentMax: 130, condition: "GOOD" },
  ],
  tents: [
    { title: "Pagoda Tent 4x4m", desc: "Elegant pagoda-style tent with peak roof. Perfect for wedding mandaps and VIP areas.", features: ["4x4m Area", "Peak Roof", "Weatherproof", "Easy Setup", "Side Panels Available"], buyMin: 85000, buyMax: 110000, rentMin: 3000, rentMax: 5000, condition: "GOOD" },
    { title: "Folding Canopy 3x3m", desc: "Quick-setup folding canopy tent. Ideal for markets, fairs, and outdoor events.", features: ["3x3m Area", "Folding Frame", "UV Resistant", "Height Adjustable", "Carry Bag"], buyMin: 15000, buyMax: 22000, rentMin: 500, rentMax: 900, condition: "GOOD" },
    { title: "Frame Tent 10x15m", desc: "Large frame tent for major events. No center poles for unobstructed space.", features: ["10x15m Area", "No Center Poles", "Modular Design", "Professional Setup", "Sidewalls"], buyMin: 500000, buyMax: 650000, rentMin: 15000, rentMax: 25000, condition: "GOOD" },
  ],
  decoration: [
    { title: "LED Fairy String Lights (50m)", desc: "Warm white LED fairy lights, 50 meters long. Create magical ambiance for any event.", features: ["50m Length", "Warm White LED", "8 Modes", "Waterproof IP65", "USB Powered"], buyMin: 1200, buyMax: 2000, rentMin: 100, rentMax: 200, condition: "NEW" },
    { title: "Flower Stand / Mandap Frame", desc: "Decorative metal frame for flower arrangements and mandap setups. Customizable design.", features: ["Adjustable Size", "Gold Finish", "Stable Base", "Easy Assembly", "Floral Clips"], buyMin: 18000, buyMax: 25000, rentMin: 800, rentMax: 1500, condition: "GOOD" },
    { title: "Balloon Arch Kit (Complete)", desc: "Complete balloon arch setup with stand, balloons, and pump. Various color themes available.", features: ["Arch Stand", "200+ Balloons", "Electric Pump", "Color Options", "Reusable Stand"], buyMin: 3500, buyMax: 5000, rentMin: 500, rentMax: 1000, condition: "GOOD" },
    { title: "Centerpiece Collection Set (10pcs)", desc: "Elegant centerpiece set for 10 tables. Includes vases, candles, and decorative elements.", features: ["10 Centerpieces", "Glass Vases", "LED Candles", "Decorative Stones", "Table Numbers"], buyMin: 8000, buyMax: 12000, rentMin: 400, rentMax: 800, condition: "LIKE_NEW" },
  ],
  "stage-equipment": [
    { title: "Portable Stage Platform 4x8ft", desc: "Professional modular stage platform. Heavy-duty construction supports up to 150kg/sqm.", features: ["4x8ft Platform", "150kg/sqm Load", "Adjustable Height", "Quick Assembly", "Non-slip Surface"], buyMin: 45000, buyMax: 60000, rentMin: 2000, rentMax: 3500, condition: "GOOD" },
    { title: "DJ Booth Table", desc: "Professional DJ booth with shelf and controller space. LED edge lighting included.", features: ["Controller Shelf", "LED Edge Lighting", "Cable Management", "Folding Design", "Travel Case"], buyMin: 25000, buyMax: 35000, rentMin: 800, rentMax: 1500, condition: "LIKE_NEW" },
    { title: "Truss System 3m x 3m", desc: "Aluminum truss system for lighting and speaker mounting. Modular design for custom setups.", features: ["3x3m Square", "Aluminum Alloy", "Load 200kg", "Modular", "Easy Assembly"], buyMin: 65000, buyMax: 85000, rentMin: 2500, rentMax: 4000, condition: "GOOD" },
  ],
};

const CUSTOMER_NAMES = [
  "Arjun Sharma", "Priya Patel", "Rahul Mehta", "Sneha Gupta", "Vikram Singh",
  "Ananya Reddy", "Karthik Iyer", "Nisha Kapoor", "Amit Joshi", "Divya Nair",
  "Rohan Das", "Meera Krishnan", "Suresh Menon", "Pooja Verma", "Aditya Rao",
  "Kavitha Raman", "Nikhil Bansal", "Shruti Mishra", "Varun Agarwal", "Ishita Bose",
  "Deepak Chauhan", "Ritu Saxena", "Manish Tiwari", "Sonal Dubey", "Harsh Vardhan",
  "Anjali Sinha", "Prateek Mohan", "Tanya Roy", "Gaurav Pandey", "Rashi Malhotra",
  "Sanjay Kulkarni", "Lavanya Desai", "Arun Kumar", "Bhavna Jain", "Rajesh Pillai",
  "Swati Hegde", "Naveen Chandra", "Pallavi Rao", "Tushar Bhatt", "Meghna Iyer",
  "Kunal Shah", "Aparna Dutta", "Ritesh Gupta", "Neha Chatterjee", "Siddharth Nair",
  "Amrita Balan", "Pranav Menon", "Shreya Goyal", "Vivek Saxena",
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function main() {
  console.log("Seeding database...");

  // Create categories
  const categories: Record<string, any> = {};
  for (const cat of CATEGORIES) {
    const c = await db.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = c;
  }

  // Create vendors and users
  const vendors: any[] = [];
  for (let i = 0; i < VENDORS.length; i++) {
    const v = VENDORS[i];
    const user = await db.user.upsert({
      where: { email: v.email },
      update: {},
      create: {
        email: v.email,
        name: v.name + " Admin",
        password: await bcrypt.hash("vendor123", 12),
        role: "VENDOR",
      },
    });
    const vendor = await db.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: v.name,
        phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
        description: v.desc,
        isVerified: true,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      },
    });
    vendors.push({ ...vendor, user });
  }

  // Create products
  let productCount = 0;
  const allProducts: any[] = [];
  for (const [slug, templates] of Object.entries(PRODUCT_TEMPLATES)) {
    const category = categories[slug];
    for (const tmpl of templates) {
      const vendor = pick(vendors);
      const buyPrice = rand(tmpl.buyMin, tmpl.buyMax);
      const rentPrice = rand(tmpl.rentMin, tmpl.rentMax);
      const deposit = Math.round(buyPrice * 0.1);
      const stock = rand(1, 8);

      const product = await db.product.create({
        data: {
          vendorId: vendor.id,
          categoryId: category.id,
          title: tmpl.title,
          slug: slugify(tmpl.title),
          description: tmpl.desc,
          features: JSON.stringify(tmpl.features),
          buyPrice,
          rentPricePerDay: rentPrice,
          deposit,
          stock,
          status: "AVAILABLE",
          condition: tmpl.condition,
          imageUrl: `https://picsum.photos/seed/${slugify(tmpl.title)}/600/400`,
        },
        include: { vendor: true, category: true },
      });
      allProducts.push(product);
      productCount++;
    }
  }
  console.log(`Created ${productCount} products`);

  // Create customers
  const customers: any[] = [];
  for (const name of CUSTOMER_NAMES) {
    const email = `${name.toLowerCase().replace(/ /g, ".")}@email.com`;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name,
        password: await bcrypt.hash("customer123", 12),
        role: "CUSTOMER",
        phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
      },
    });
    customers.push(user);
  }

  // Create admin user
  await db.user.upsert({
    where: { email: "admin@rentwise.ai" },
    update: {},
    create: {
      email: "admin@rentwise.ai",
      name: "Admin User",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });

  // Create bookings
  const statuses = ["PENDING", "APPROVED", "CONFIRMED", "DELIVERED", "RETURNED", "COMPLETED", "CANCELLED"];
  const bookingTypes: ("RENT" | "BUY" | "BOOK")[] = ["RENT", "BUY", "BOOK"];
  let bookingCount = 0;

  for (let i = 0; i < 80; i++) {
    const customer = pick(customers);
    const product = pick(allProducts);
    const bType = pick(bookingTypes);
    const days = rand(1, 14);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rand(0, 60));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    let totalPrice = 0;
    if (bType === "RENT") totalPrice = product.rentPricePerDay * days;
    else if (bType === "BUY") totalPrice = product.buyPrice;
    else totalPrice = product.rentPricePerDay * Math.max(1, Math.floor(days / 2));

    const status = pick(statuses);

    const booking = await db.booking.create({
      data: {
        userId: customer.id,
        productId: product.id,
        bookingType: bType,
        startDate,
        endDate,
        quantity: rand(1, 3),
        totalPrice,
        depositAmount: bType === "RENT" ? product.deposit : 0,
        status,
        notes: status === "CANCELLED" ? "Cancelled by customer" : undefined,
      },
    });

    // Create payment
    if (status !== "PENDING" && status !== "CANCELLED" && status !== "REJECTED") {
      await db.payment.create({
        data: {
          bookingId: booking.id,
          paymentStatus: status === "COMPLETED" || status === "RETURNED" ? "COMPLETED" : "PENDING",
          paymentMethod: pick(["ONLINE", "UPI", "CARD"]),
          amount: totalPrice,
          paidAt: new Date(startDate.getTime() + 86400000),
        },
      });
    }

    // Create reviews for completed bookings
    if (status === "COMPLETED" && Math.random() > 0.3) {
      const reviewComments = [
        "Excellent quality! Highly recommend.",
        "Good condition, delivery was on time.",
        "Decent product for the price. Would rent again.",
        "Amazing service! The equipment was in perfect condition.",
        "Great value for money. Very professional vendor.",
        "Product was exactly as described. No issues at all.",
        "Slightly worn but worked perfectly for our event.",
        "Top-notch quality. Will definitely come back!",
        "Fair pricing and good customer support.",
        "Equipment exceeded expectations. Superb!",
      ];
      await db.review.create({
        data: {
          userId: customer.id,
          productId: product.id,
          bookingId: booking.id,
          rating: rand(3, 5),
          comment: pick(reviewComments),
        },
      });
    }
    bookingCount++;
  }
  console.log(`Created ${bookingCount} bookings`);

  // Create some AI recommendations
  const aiRecs = [
    { prompt: "DSLR camera for 3 days wedding shoot", recommendation: "RENT", explanation: "Renting a Canon EOS R5 for 3 days costs ₹7,500 vs buying at ₹2,80,000. You save ₹2,72,500 (97.3%) since this is a one-time event." },
    { prompt: "Speakers for college tech fest 300 attendees", recommendation: "RENT", explanation: "For a 2-day event, renting JBL VTX system at ₹16,000 is far more economical than buying at ₹5,00,000. Rental saves 96.8%." },
    { prompt: "Projector for monthly team presentations", recommendation: "RENT", explanation: "At ₹3,000/month rental vs ₹1,20,000 purchase, renting saves money unless you need it for 40+ months." },
    { prompt: "LED Wall for product launch", recommendation: "RENT", explanation: "One-time event — renting P3.9 LED panels at ₹15,000 vs buying at ₹3,50,000 saves 95.7%." },
    { prompt: "Microphones for weekly podcast recording", recommendation: "BUY", explanation: "Weekly use over 6+ months makes buying Shure SM58 at ₹9,500 more economical than renting at ₹200/session." },
  ];

  for (const rec of aiRecs) {
    await db.aIRecommendation.create({
      data: {
        prompt: rec.prompt,
        recommendation: rec.recommendation,
        explanation: rec.explanation,
        savings: Math.round(Math.random() * 50000 + 5000),
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("\n--- Demo Accounts ---");
  console.log("Admin: admin@rentwise.ai / admin123");
  console.log("Vendor: progear@rentwise.ai / vendor123");
  console.log("Customer: arjun.sharma@email.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());