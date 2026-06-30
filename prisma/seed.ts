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
  { name: "ProGear Rentals", email: "progear@rentwise.ai", desc: "Premium event equipment rentals with 10+ years experience", city: "Bengaluru" },
  { name: "SoundWave Audio", email: "soundwave@rentwise.ai", desc: "Professional audio equipment for events of all sizes", city: "Mumbai" },
  { name: "LightCraft Studios", email: "lightcraft@rentwise.ai", desc: "Studio-grade lighting and photography equipment", city: "Delhi" },
  { name: "EventMax Solutions", email: "eventmax@rentwise.ai", desc: "One-stop solution for all event equipment needs", city: "Hyderabad" },
  { name: "TechRent Hub", email: "techrent@rentwise.ai", desc: "Latest technology and AV equipment on rent", city: "Pune" },
  { name: "BrightStage Rentals", email: "brightstage@rentwise.ai", desc: "Stage setups, LED walls, and event infrastructure", city: "Chennai" },
  { name: "CityFurniture Hire", email: "cityfurniture@rentwise.ai", desc: "Elegant furniture for weddings, parties, and corporate events", city: "Jaipur" },
  { name: "CaptureEquip", email: "capture@rentwise.ai", desc: "DSLRs, lenses, gimbals, and camera accessories", city: "Bengaluru" },
  { name: "ShutterStock Rentals", email: "shutterstock@rentwise.ai", desc: "Photography and videography gear for professionals", city: "Mumbai" },
  { name: "BassBox Audio", email: "bassbox@rentwise.ai", desc: "PA systems, subwoofers, and audio mixers", city: "Delhi" },
  { name: "LumiFlex LEDs", email: "lumiflex@rentwise.ai", desc: "LED panels, strips, and professional lighting solutions", city: "Hyderabad" },
  { name: "WeddingCraft India", email: "weddingcraft@rentwise.ai", desc: "Complete wedding equipment and decoration solutions", city: "Jaipur" },
  { name: "RentalKing Mumbai", email: "rentalking@rentwise.ai", desc: "General event equipment for all occasions", city: "Mumbai" },
  { name: "TechSetup Delhi", email: "techsetup@rentwise.ai", desc: "AV equipment, projectors, and tech for conferences", city: "Delhi" },
  { name: "GreenRoom Studios", email: "greenroom@rentwise.ai", desc: "Studio equipment for content creators and filmmakers", city: "Pune" },
  { name: "Amplify Sound Co.", email: "amplify@rentwise.ai", desc: "Concert-grade sound systems and mixing consoles", city: "Chennai" },
  { name: "StageRight Events", email: "stageright@rentwise.ai", desc: "Modular stages, trusses, and rigging equipment", city: "Bengaluru" },
  { name: "LightHouse Pro", email: "lighthouse@rentwise.ai", desc: "Professional stage and event lighting", city: "Mumbai" },
  { name: "FurnitureFirst", email: "furniturefirst@rentwise.ai", desc: "Modern and traditional event furniture", city: "Delhi" },
  { name: "MegaScreen India", email: "megascreen@rentwise.ai", desc: "Large format LED walls and projection screens", city: "Hyderabad" },
];

type ProductTemplate = { title: string; desc: string; features: string[]; buyMin: number; buyMax: number; rentMin: number; rentMax: number; condition: string };

const PRODUCT_TEMPLATES: Record<string, ProductTemplate[]> = {
  cameras: [
    { title: "Canon EOS R5", desc: "Professional 45MP full-frame mirrorless camera with 8K video. Ideal for weddings, events, and commercial shoots.", features: ["45MP Full-Frame Sensor", "8K RAW Video", "In-Body IS", "Dual CFexpress Slots", "Weather Sealed"], buyMin: 250000, buyMax: 320000, rentMin: 2500, rentMax: 4000, condition: "LIKE_NEW" },
    { title: "Sony A7 IV", desc: "Versatile 33MP full-frame hybrid camera with advanced AI autofocus for photo and video.", features: ["33MP Sensor", "4K 60p Video", "AI Autofocus", "10fps Burst", "Flip Screen"], buyMin: 180000, buyMax: 220000, rentMin: 2000, rentMax: 3000, condition: "GOOD" },
    { title: "Nikon Z6 III", desc: "Pro-grade 24.5MP mirrorless with exceptional low-light performance for events.", features: ["24.5MP Sensor", "6K Video", "EXPEED 7", "493 AF Points", "Dual Card Slots"], buyMin: 195000, buyMax: 240000, rentMin: 2200, rentMax: 3200, condition: "LIKE_NEW" },
    { title: "Canon EOS R6 Mark II", desc: "High-speed 24.2MP mirrorless with incredible autofocus tracking for sports.", features: ["24.2MP Sensor", "40fps Electronic", "6K ProRes", "Advanced AF", "5-Axis IS"], buyMin: 160000, buyMax: 200000, rentMin: 1800, rentMax: 2800, condition: "GOOD" },
    { title: "Sony FX3 Cinema Camera", desc: "Compact cinema camera for filmmakers with exceptional low-light and 4K 120p.", features: ["10.1MP Full-Frame", "4K 120p", "Cinematic Colors", "Active Cooling", "XLR Audio"], buyMin: 350000, buyMax: 420000, rentMin: 4500, rentMax: 6000, condition: "NEW" },
    { title: "GoPro HERO12 Black", desc: "Rugged action camera with 5.3K video and HyperSmooth stabilization.", features: ["5.3K60 Video", "HyperSmooth 6.0", "Waterproof 33ft", "HDR Photos", "27MP Sensor"], buyMin: 45000, buyMax: 55000, rentMin: 500, rentMax: 800, condition: "GOOD" },
    { title: "DJI Mavic 3 Pro Drone", desc: "Professional drone with triple-camera system and 43-minute flight time.", features: ["Triple Camera System", "4/3 CMOS Hasselblad", "43min Flight Time", "O3+ Transmission", "Waypoint Flying"], buyMin: 280000, buyMax: 330000, rentMin: 3500, rentMax: 5000, condition: "LIKE_NEW" },
    { title: "Fujifilm X-T5", desc: "Retro-styled 40MP APS-C mirrorless with film simulation modes.", features: ["40MP X-Trans Sensor", "6.2K Video", "IBIS", "Film Simulations", "Weather Sealed"], buyMin: 155000, buyMax: 185000, rentMin: 1500, rentMax: 2500, condition: "NEW" },
    { title: "Canon RF 70-200mm f/2.8L IS", desc: "Professional telephoto zoom lens for sports, portraits, and events.", features: ["70-200mm f/2.8", "5-stop IS", "Nano USM", "Fluorite Coating", "Weather Sealed"], buyMin: 195000, buyMax: 240000, rentMin: 1200, rentMax: 2000, condition: "LIKE_NEW" },
    { title: "Sony 24-70mm f/2.8 GM II", desc: "Premium standard zoom lens with exceptional sharpness and bokeh.", features: ["24-70mm f/2.8", "4 XD Linear Motors", "Nano AR Coating II", "Compact Design", "Weather Sealed"], buyMin: 175000, buyMax: 210000, rentMin: 1000, rentMax: 1800, condition: "GOOD" },
    { title: "DJI RS 3 Pro Gimbal", desc: "Professional 3-axis gimbal stabilizer for cinema cameras up to 4.5kg.", features: ["4.5kg Payload", "LiDAR Focus", "12hr Battery", "Wireless Shutter", "Automatic Calibration"], buyMin: 52000, buyMax: 65000, rentMin: 800, rentMax: 1500, condition: "GOOD" },
    { title: "Sony A6700 with 18-135mm Kit", desc: "Versatile APS-C camera kit perfect for vlogging and travel content.", features: ["26MP APS-C Sensor", "4K 120p", "AI Tracking AF", "Flip Screen", "18-135mm Lens"], buyMin: 125000, buyMax: 155000, rentMin: 1200, rentMax: 2000, condition: "GOOD" },
    { title: "Blackmagic Pocket 6K Pro", desc: "Cinema-grade 6K camera with EF mount and built-in ND filters.", features: ["6K EF Mount", "Built-in ND", "Dual CFast", "DaVinci Resolve", "ProRes & BRAW"], buyMin: 195000, buyMax: 240000, rentMin: 3000, rentMax: 4500, condition: "GOOD" },
    { title: "Canon EOS R10 + RF-S 18-45mm", desc: "Entry-level mirrorless with fast AF, great for beginner photographers.", features: ["24.2MP APS-C", "4K 60p Cropped", "Subject Tracking AF", "Lightweight 429g", "18-45mm Lens"], buyMin: 70000, buyMax: 85000, rentMin: 600, rentMax: 1000, condition: "LIKE_NEW" },
    { title: "Rode Wireless PRO", desc: "Dual-channel wireless microphone system with 32-bit float recording.", features: ["Dual Transmitters", "32-bit Float", "200m Range", "Timecode Sync", "USB-C Charging"], buyMin: 32000, buyMax: 40000, rentMin: 500, rentMax: 900, condition: "NEW" },
  ],
  speakers: [
    { title: "JBL VTX A12 Line Array", desc: "Professional line array for large venues. Crystal clear sound at any volume.", features: ["1200W per cabinet", "Line Array Design", "Rigging Hardware", "Weather Resistant", "DSP Built-in"], buyMin: 450000, buyMax: 550000, rentMin: 8000, rentMax: 12000, condition: "GOOD" },
    { title: "Bose L1 Pro32 Portable", desc: "Portable line array with deep bass and wide coverage for mid-size events.", features: ["132 Drivers", "Built-in Sub", "Bass Module", "Lightweight", "Bluetooth Input"], buyMin: 120000, buyMax: 150000, rentMin: 3000, rentMax: 5000, condition: "LIKE_NEW" },
    { title: "QSC KLA12 Active Speaker", desc: "Fixed-arcuation line array for corporate events and conferences.", features: ["500W Class D", '12" LF Driver', "Passive Rigging", "90° x 18° Coverage", "Lightweight"], buyMin: 85000, buyMax: 110000, rentMin: 2000, rentMax: 3500, condition: "GOOD" },
    { title: "JBL EON715 Powered Speaker", desc: "Versatile 15\" powered speaker with Bluetooth for DJ setups.", features: ["1300W Power", '15" Woofer', "Bluetooth 5.0", "DSP Processing", "Lightweight"], buyMin: 55000, buyMax: 70000, rentMin: 1200, rentMax: 2000, condition: "GOOD" },
    { title: "SubZero SZP-18S Subwoofer", desc: "Powerful 18\" subwoofer for deep bass. Essential for music events.", features: ['18" Driver', "1200W RMS", "Front Ported", "Pole Mount", "XLR Input"], buyMin: 65000, buyMax: 80000, rentMin: 1500, rentMax: 2500, condition: "FAIR" },
    { title: "JBL PartyBox Stage 320", desc: "Powerful portable party speaker with RGB lights and karaoke mic.", features: ["240W Output", "Karaoke Mic", "RGB Light Show", "20hr Battery", "IPX4 Waterproof"], buyMin: 35000, buyMax: 45000, rentMin: 800, rentMax: 1500, condition: "GOOD" },
    { title: "Sony SRS-XV500 Party Speaker", desc: "High-power party speaker with omnidirectional sound and lighting.", features: ["360° Sound", "RGB Lighting", "Karaoke Features", "25hr Battery", "IPX4 Rated"], buyMin: 28000, buyMax: 38000, rentMin: 600, rentMax: 1200, condition: "LIKE_NEW" },
    { title: "Yamaha DXR12 Powered Speaker", desc: "Professional 12\" powered speaker with D-CONTOUR technology.", features: ["1100W Power", "D-CONTOUR", '12" Woofer', "DSP Functions", "Firmware Updates"], buyMin: 75000, buyMax: 95000, rentMin: 1800, rentMax: 3000, condition: "GOOD" },
    { title: "JBL PRX815W Wireless Speaker", desc: "Two-way powered speaker with built-in Wi-Fi for wireless control.", features: ["1500W Crown Amp", '15" Driver', "Wi-Fi Control", "JBL Pro App", "DSP Presets"], buyMin: 95000, buyMax: 120000, rentMin: 2500, rentMax: 4000, condition: "LIKE_NEW" },
    { title: "QSC K.2 Series KSUB", desc: "High-performance 1000W powered subwoofer for deep bass extension.", features: ["1000W Class D", '12" Driver', "DSP Processing", "XLR & RCA", "Pole Mount Socket"], buyMin: 75000, buyMax: 95000, rentMin: 1500, rentMax: 2500, condition: "GOOD" },
    { title: "Behringer Eurolive B212D", desc: "Budget-friendly active 500W PA speaker for small events.", features: ["500W Class D", '12" Woofer', '1.35" Titanium Tweeter', "Lightweight", "Built-in Mixer"], buyMin: 20000, buyMax: 28000, rentMin: 400, rentMax: 700, condition: "GOOD" },
    { title: "Bose F1 Model 812 Flexible Array", desc: "Flexible array speaker with adjustable coverage pattern.", features: ["160° x 60° Array", "1000W Power", "8 Drivers", "Detachable Array", "Pole Mount"], buyMin: 110000, buyMax: 140000, rentMin: 2500, rentMax: 4000, condition: "LIKE_NEW" },
  ],
  projectors: [
    { title: "Epson EB-L200F Laser Projector", desc: "4K laser projector with 4500 lumens for presentations and screenings.", features: ["4500 Lumens", "4K Resolution", "Laser Light Source", "20,000hr Life", "HDMI & USB-C"], buyMin: 280000, buyMax: 350000, rentMin: 4000, rentMax: 6000, condition: "LIKE_NEW" },
    { title: "BenQ W2700i 4K Projector", desc: "Cinematic 4K HDR projector with Android TV for premium events.", features: ["4K UHD", "2400 Lumens", "HDR-PRO", "Android TV", "CinemaMaster"], buyMin: 190000, buyMax: 240000, rentMin: 2500, rentMax: 4000, condition: "GOOD" },
    { title: "ViewSonic PX747-4K", desc: "Budget-friendly 4K projector with 3500 lumens for conferences.", features: ["3500 Lumens", "4K UHD", "SuperColor Tech", "10W Speaker", "Multiple HDMI"], buyMin: 95000, buyMax: 120000, rentMin: 1500, rentMax: 2500, condition: "GOOD" },
    { title: "Optoma UHD38 4K Projector", desc: "Gaming and movie projector with 4000 lumens and ultra-low input lag.", features: ["4000 Lumens", "4K UHD", "4.2ms Input Lag", "240Hz Gaming", "Dynamic Black"], buyMin: 130000, buyMax: 165000, rentMin: 2000, rentMax: 3500, condition: "GOOD" },
    { title: "Sony VPL-XW5000ES 4K SXRD", desc: "Premium home theater projector with exceptional contrast and color.", features: ["4K SXRD", "2000 Lumens", "X1 Ultimate Processor", "HDR10/HLG", "Wide Lens Shift"], buyMin: 450000, buyMax: 550000, rentMin: 6000, rentMax: 9000, condition: "NEW" },
    { title: "Epson EB-FH52 1080p Projector", desc: "Reliable Full HD 4000-lumen projector for business presentations.", features: ["4000 Lumens", "1080p", "3LCD Tech", "Built-in 16W Speaker", "MHL Support"], buyMin: 65000, buyMax: 85000, rentMin: 1000, rentMax: 1800, condition: "GOOD" },
    { title: "XGIMI Horizon Pro 4K", desc: "Smart 4K laser projector with Android TV and auto keystone.", features: ["4K Laser", "2200 ISO Lumens", "Android TV 10", "Harman Kardon Audio", "Auto Keystone"], buyMin: 145000, buyMax: 180000, rentMin: 2000, rentMax: 3500, condition: "LIKE_NEW" },
    { title: "BenQ TH685i Gaming Projector", desc: "1080p gaming projector with low latency and 3500 lumens.", features: ["3500 Lumens", "1080p", "8.3ms Input Lag", "Built-in 5W Speaker", "Game Mode"], buyMin: 60000, buyMax: 80000, rentMin: 800, rentMax: 1500, condition: "GOOD" },
  ],
  lighting: [
    { title: "ARRI SkyPanel S60-C LED", desc: "Professional RGBW LED panel. Industry standard for film and premium events.", features: ["Full Color RGBW", "540W LED", "DMX Control", "High CRI 95+", "Silent Fan"], buyMin: 420000, buyMax: 500000, rentMin: 5000, rentMax: 8000, condition: "LIKE_NEW" },
    { title: "Godox VL300 LED Spotlight", desc: "Powerful 300W LED spotlight with Bowens mount for stage lighting.", features: ["300W LED", "5600K Daylight", "Bowens Mount", "DMX Control", "Wireless Remote"], buyMin: 45000, buyMax: 60000, rentMin: 1000, rentMax: 1800, condition: "GOOD" },
    { title: "Chauvet DJ SlimPAR Pro Haze", desc: "Compact LED wash light with haze effect for ambient lighting.", features: ["12x 12W LEDs", "RGBW", "DMX Control", "Haze Mode", "Low Power"], buyMin: 22000, buyMax: 30000, rentMin: 500, rentMax: 900, condition: "GOOD" },
    { title: "Nanlite Forza 500B II", desc: "Bi-color 500W LED monolight with CRI 96+ for professional work.", features: ["500W Bi-Color", "2700-6500K", "CRI 96+", "Bowens Mount", "App Control"], buyMin: 85000, buyMax: 105000, rentMin: 1500, rentMax: 2500, condition: "NEW" },
    { title: "ADJ Mega Par Profile", desc: "Compact LED par can with RGBA color mixing for stage wash.", features: ["RGBA LEDs", "DMX Control", "Sound Active Mode", "Standalone", "Half Can Design"], buyMin: 8000, buyMax: 12000, rentMin: 200, rentMax: 400, condition: "GOOD" },
    { title: "Elgato Key Light Air", desc: "Premium panel light for streaming, video calls, and content creation.", features: ["1400 Lumens", "2800-7000K", "WiFi Control", "Edge-lit", "Ultra-thin Design"], buyMin: 18000, buyMax: 24000, rentMin: 400, rentMax: 700, condition: "LIKE_NEW" },
    { title: "Godox AD600 Pro Witstro", desc: "600W outdoor flash with TTL and HSS for wedding and event photography.", features: ["600W Output", "TTL & HSS", "Bowens Mount", "2.5s Recycle", "GPS Mode"], buyMin: 55000, buyMax: 72000, rentMin: 1200, rentMax: 2000, condition: "GOOD" },
    { title: "Aputure LS 600x Pro", desc: "Daylight-balanced 600W LED fixture with Light Shaper compatibility.", features: ["600W LED", "5600K Daylight", "Bowens Mount", "Weather Resistant", "Wireless Control"], buyMin: 95000, buyMax: 120000, rentMin: 2000, rentMax: 3500, condition: "NEW" },
    { title: "Chauvet Intimidator Spot 360 IRC", desc: "Powerful moving head spot with gobo rotation for stage shows.", features: ["LED Moving Head", "Gobo Rotation", "3-facet Prism", "IRC Remote", "Sound Active"], buyMin: 45000, buyMax: 58000, rentMin: 1000, rentMax: 1800, condition: "GOOD" },
    { title: "Godox ML60 II Bi-Color", desc: "Compact 60W bi-color LED light for interviews and small shoots.", features: ["60W Bi-Color", "2800-6500K", "CRI 96+", "Bowens Mount", "App Control"], buyMin: 15000, buyMax: 20000, rentMin: 300, rentMax: 600, condition: "LIKE_NEW" },
  ],
  microphones: [
    { title: "Shure SM58 Dynamic Mic", desc: "Industry standard vocal microphone. Legendary durability and clarity.", features: ["Dynamic Capsule", "50Hz-15kHz", "Cardioid Pattern", "Rugged Build", "Pneumatic Shock Mount"], buyMin: 8500, buyMax: 11000, rentMin: 200, rentMax: 400, condition: "GOOD" },
    { title: "Sennheiser EW 500 G4 Wireless", desc: "Professional wireless mic system with exceptional audio quality.", features: ["True Diversity", "1680 Frequencies", "50m Range", "Ethernet Control", "LCD Display"], buyMin: 95000, buyMax: 120000, rentMin: 2500, rentMax: 4000, condition: "LIKE_NEW" },
    { title: "Rode NTG5 Shotgun Mic", desc: "Lightweight broadcast-grade shotgun microphone for film and outdoor.", features: ["Broadcast Grade", "Super Cardioid", "Low Noise", "Lightweight", "RF Bias"], buyMin: 28000, buyMax: 35000, rentMin: 600, rentMax: 1000, condition: "GOOD" },
    { title: "Audio-Technica AT2020 Condenser", desc: "Studio-quality condenser mic for recording and streaming.", features: ["Cardioid Condenser", "20Hz-20kHz", "High SPL", "Rugged Build", "XLR Output"], buyMin: 7500, buyMax: 9500, rentMin: 150, rentMax: 300, condition: "LIKE_NEW" },
    { title: "HyperX QuadCast S", desc: "USB streaming microphone with RGB lighting and tap-to-mute.", features: ["USB Connection", "4 Polar Patterns", "Tap-to-Mute", "RGB Lighting", "Built-in Shock Mount"], buyMin: 12000, buyMax: 16000, rentMin: 300, rentMax: 500, condition: "GOOD" },
    { title: "Blue Yeti X Professional", desc: "Premium USB microphone with multi-pattern and LED metering.", features: ["4 Capsule Array", "USB & XLR", "LED Metering", "Blue VO!CE Software", "Desk Stand"], buyMin: 15000, buyMax: 20000, rentMin: 350, rentMax: 600, condition: "NEW" },
    { title: "Shure SM7B Dynamic Studio Mic", desc: "Broadcast-standard dynamic mic for vocals, podcasts, and streaming.", features: ["Dynamic Capsule", "Flat 50Hz-20kHz", "Pop Filter", "Shock Mount", "XLR Output"], buyMin: 22000, buyMax: 28000, rentMin: 500, rentMax: 900, condition: "LIKE_NEW" },
    { title: "Rode Wireless GO II", desc: "Compact wireless mic system with onboard recording.", features: ["Compact TX/RX", "Onboard Recording", "200m Range", "USB-C Charging", "Gain Assist"], buyMin: 18000, buyMax: 24000, rentMin: 400, rentMax: 700, condition: "GOOD" },
    { title: "Sennheiser MKH 416 Shotgun", desc: "Industry-standard shotgun mic for film, TV, and ENG production.", features: ["Short Shotgun", "Super Cardioid/Lobe", "Low Self-Noise", "RF Interference Resistant", "Phantom Powered"], buyMin: 65000, buyMax: 80000, rentMin: 1200, rentMax: 2000, condition: "GOOD" },
    { title: "Shure MV7+ Podcast Mic", desc: "Dynamic USB/XLR hybrid mic designed for podcasting and streaming.", features: ["USB & XLR", "Dynamic Capsule", "Built-in Headphone Out", "ShurePlus MOTIV App", "Touch Panel"], buyMin: 18000, buyMax: 24000, rentMin: 400, rentMax: 700, condition: "NEW" },
  ],
  "led-walls": [
    { title: "P3.9 Indoor LED Panel (500x500mm)", desc: "High-resolution indoor LED panel for video walls and exhibitions.", features: ["P3.9mm Pitch", "500x500mm", "500 Nits", "16-bit Color", "Easy Installation"], buyMin: 35000, buyMax: 45000, rentMin: 1500, rentMax: 2500, condition: "GOOD" },
    { title: "P2.6 Fine Pixel LED Panel", desc: "Ultra-fine pixel pitch LED panel for close-viewing applications.", features: ["P2.6mm Pitch", "600x337.5mm", "600 Nits", "HDR Support", "Lightweight"], buyMin: 55000, buyMax: 70000, rentMin: 2000, rentMax: 3500, condition: "LIKE_NEW" },
    { title: "Outdoor P5 LED Display Panel", desc: "Weatherproof outdoor LED panel with high brightness.", features: ["P5mm Pitch", "640x640mm", "6500 Nits", "IP65 Rated", "Wide Viewing Angle"], buyMin: 45000, buyMax: 58000, rentMin: 1800, rentMax: 3000, condition: "GOOD" },
    { title: "P4.8 Indoor SMD LED Panel", desc: "Cost-effective SMD LED panel for medium-distance viewing.", features: ["P4.8mm Pitch", "500x500mm", "800 Nits", "Front Maintenance", "Lightweight Cabinet"], buyMin: 25000, buyMax: 35000, rentMin: 1000, rentMax: 1800, condition: "GOOD" },
    { title: "P6 Outdoor DIP LED Panel", desc: "High-brightness outdoor DIP LED for large format displays.", features: ["P6mm Pitch", "960x960mm", "7500 Nits", "IP65 Waterproof", "Modular Design"], buyMin: 38000, buyMax: 50000, rentMin: 1500, rentMax: 2500, condition: "FAIR" },
    { title: "P1.8 Micro LED Panel", desc: "Ultra-fine micro LED for premium close-up viewing.", features: ["P1.8mm Pitch", "600x337.5mm", "500 Nits", "HDR10 Support", "Cabinet Lock System"], buyMin: 85000, buyMax: 110000, rentMin: 3000, rentMax: 5000, condition: "NEW" },
    { title: "Flexible LED Screen (Curved)", desc: "Flexible LED mesh screen for creative curved installations.", features: ["P3.91mm Pitch", "Flexible PCB", "Magnetic Installation", "Lightweight", "Curved Surface Support"], buyMin: 42000, buyMax: 55000, rentMin: 2000, rentMax: 3500, condition: "LIKE_NEW" },
    { title: "Transparent LED Display Panel", desc: "See-through LED panel for retail and exhibition use.", features: ["P3.9mm Pitch", "70% Transparency", "500x1000mm", "Lightweight", "Easy Front Service"], buyMin: 65000, buyMax: 85000, rentMin: 2500, rentMax: 4500, condition: "NEW" },
  ],
  furniture: [
    { title: "Chiavari Chair (Gold)", desc: "Elegant gold Chiavari chair for weddings and formal events.", features: ["Solid Wood", "Gold Finish", "Cushion Included", "Stackable", "350lb Capacity"], buyMin: 4500, buyMax: 6000, rentMin: 80, rentMax: 150, condition: "GOOD" },
    { title: "Round Banquet Table (6ft)", desc: "6-foot round table seating 8-10 guests for receptions.", features: ['72" Diameter', "Seats 8-10", "Folding Legs", "Steel Frame", "Scratch Resistant"], buyMin: 12000, buyMax: 16000, rentMin: 200, rentMax: 400, condition: "GOOD" },
    { title: "Cocktail High-Top Table", desc: "Modern adjustable-height cocktail table for networking events.", features: ["Adjustable Height", '30" Round Top', "Steel Base", "Folding", "Modern Design"], buyMin: 8000, buyMax: 11000, rentMin: 150, rentMax: 300, condition: "LIKE_NEW" },
    { title: "Tiffany Chair (White)", desc: "Classic white Tiffany chair for garden and beach weddings.", features: ["Solid Wood", "White Finish", "Spindled Back", "Cushion Included", "Lightweight"], buyMin: 3800, buyMax: 5000, rentMin: 70, rentMax: 130, condition: "GOOD" },
    { title: "Conference Stage Platform (8x4ft)", desc: "Raising platform for conference stages and head tables.", features: ["8x4ft Platform", "16in Height", "Carpet Top", "Steel Frame", "Modular"], buyMin: 25000, buyMax: 35000, rentMin: 800, rentMax: 1500, condition: "GOOD" },
    { title: "Standing Desk (Adjustable)", desc: "Electric height-adjustable desk for conferences and exhibitions.", features: ["Electric Motor", "Adjustable 28-48in", "White Top", "Cable Management", "120kg Capacity"], buyMin: 25000, buyMax: 35000, rentMin: 500, rentMax: 900, condition: "LIKE_NEW" },
    { title: "Cross-Back Chair (Natural)", desc: "Rustic cross-back chair for farmhouse and outdoor events.", features: ["Solid Wood", "Natural Finish", "Cross Back", "Stackable", "Comfortable Seat"], buyMin: 3200, buyMax: 4500, rentMin: 60, rentMax: 120, condition: "GOOD" },
    { title: "Rectangular Banquet Table (8ft)", desc: "Standard 8-foot rectangular table for buffets and conference.", features: ["8ft x 30in", "Seats 8-10", "Folding Legs", "Plastic Top", "Lightweight"], buyMin: 10000, buyMax: 14000, rentMin: 150, rentMax: 300, condition: "GOOD" },
    { title: "VIP Lounge Sofa (3-seater)", desc: "Modern 3-seater sofa for VIP lounges and reception areas.", features: ["Upholstered", "3-Seater", "Modern Design", "Sturdy Frame", "Easy Clean"], buyMin: 35000, buyMax: 50000, rentMin: 800, rentMax: 1500, condition: "LIKE_NEW" },
    { title: "Servery / Buffet Table (6ft)", desc: "6-foot servery table with skirt for buffet and food service.", features: ["6ft x 30in", "Adjustable Height", "Skirt Included", "Folding Legs", "Food Safe"], buyMin: 8000, buyMax: 12000, rentMin: 200, rentMax: 400, condition: "GOOD" },
  ],
  tents: [
    { title: "Pagoda Tent 4x4m", desc: "Elegant pagoda-style tent with peak roof for weddings.", features: ["4x4m Area", "Peak Roof", "Weatherproof", "Easy Setup", "Side Panels Available"], buyMin: 85000, buyMax: 110000, rentMin: 3000, rentMax: 5000, condition: "GOOD" },
    { title: "Folding Canopy 3x3m", desc: "Quick-setup canopy for markets and outdoor events.", features: ["3x3m Area", "Folding Frame", "UV Resistant", "Height Adjustable", "Carry Bag"], buyMin: 15000, buyMax: 22000, rentMin: 500, rentMax: 900, condition: "GOOD" },
    { title: "Frame Tent 10x15m", desc: "Large frame tent for major events. No center poles.", features: ["10x15m Area", "No Center Poles", "Modular Design", "Professional Setup", "Sidewalls"], buyMin: 500000, buyMax: 650000, rentMin: 15000, rentMax: 25000, condition: "GOOD" },
    { title: "Marquee Tent 6x12m", desc: "Classic marquee with elegant peaks for wedding receptions.", features: ["6x12m Area", "Peak Roof Design", "Windows", "Lined Interior", "Modular"], buyMin: 250000, buyMax: 350000, rentMin: 8000, rentMax: 14000, condition: "GOOD" },
    { title: "Gazebo 3x3m (Hexagonal)", desc: "Hexagonal gazebo for garden parties and intimate events.", features: ["3x3m Hexagonal", "Steel Frame", "UV Resistant Canopy", "Mesh Side Panels", "Easy Assembly"], buyMin: 18000, buyMax: 28000, rentMin: 600, rentMax: 1200, condition: "LIKE_NEW" },
    { title: "Stretch Tent 10x10m", desc: "Freeform stretch tent for modern outdoor events and festivals.", features: ["10x10m Area", "Stretch Fabric", "No Poles Needed", "Weatherproof", "Stylish Design"], buyMin: 350000, buyMax: 450000, rentMin: 12000, rentMax: 20000, condition: "GOOD" },
  ],
  decoration: [
    { title: "LED Fairy String Lights (50m)", desc: "Warm white LED fairy lights, 50m long for magical ambiance.", features: ["50m Length", "Warm White LED", "8 Modes", "Waterproof IP65", "USB Powered"], buyMin: 1200, buyMax: 2000, rentMin: 100, rentMax: 200, condition: "NEW" },
    { title: "Flower Stand / Mandap Frame", desc: "Decorative metal frame for flower arrangements and mandaps.", features: ["Adjustable Size", "Gold Finish", "Stable Base", "Easy Assembly", "Floral Clips"], buyMin: 18000, buyMax: 25000, rentMin: 800, rentMax: 1500, condition: "GOOD" },
    { title: "Balloon Arch Kit (Complete)", desc: "Complete balloon arch with stand, balloons, and pump.", features: ["Arch Stand", "200+ Balloons", "Electric Pump", "Color Options", "Reusable Stand"], buyMin: 3500, buyMax: 5000, rentMin: 500, rentMax: 1000, condition: "GOOD" },
    { title: "Centerpiece Collection Set (10pcs)", desc: "Elegant centerpiece set for 10 tables with vases and candles.", features: ["10 Centerpieces", "Glass Vases", "LED Candles", "Decorative Stones", "Table Numbers"], buyMin: 8000, buyMax: 12000, rentMin: 400, rentMax: 800, condition: "LIKE_NEW" },
    { title: "Photo Backdrop Stand (8x10ft)", desc: "Adjustable backdrop frame for photo booths and stage backgrounds.", features: ["8x10ft Adjustable", "Steel Pipes", "Crossbar", "Quick Assembly", "Carry Bag"], buyMin: 5000, buyMax: 8000, rentMin: 300, rentMax: 600, condition: "GOOD" },
    { title: "Photo Booth Setup (Complete)", desc: "Complete photo booth with frame, props, and ring light.", features: ["Photo Frame", "LED Ring Light", "Prop Box (50+)", "Table & Skirt", "Instant Camera"], buyMin: 25000, buyMax: 35000, rentMin: 2000, rentMax: 4000, condition: "LIKE_NEW" },
    { title: "Drape Fabric (White, 10m)", desc: "Premium white drape fabric for ceiling and wall draping.", features: ["10m Length", "3m Width", "Premium Fabric", "Fire Retardant", "Wrinkle Resistant"], buyMin: 8000, buyMax: 12000, rentMin: 500, rentMax: 1000, condition: "GOOD" },
    { title: "Paper Lantern Set (20pcs)", desc: "Set of 20 white paper lanterns in assorted sizes.", features: ["20 Lanterns", "3 Sizes (8/10/12in)", "Wire Frame", "LED Bulbs Included", "Easy Hang"], buyMin: 3000, buyMax: 5000, rentMin: 400, rentMax: 800, condition: "GOOD" },
    { title: "Welcome Sign Stand (Acrylic)", desc: "Elegant acrylic welcome sign for wedding and event entrances.", features: ["Clear Acrylic", "Gold Stand", "A4/A3 Size", "Reversible", "Lightweight"], buyMin: 5000, buyMax: 8000, rentMin: 300, rentMax: 600, condition: "LIKE_NEW" },
  ],
  "stage-equipment": [
    { title: "Portable Stage Platform 4x8ft", desc: "Professional modular stage platform, 150kg/sqm capacity.", features: ["4x8ft Platform", "150kg/sqm Load", "Adjustable Height", "Quick Assembly", "Non-slip Surface"], buyMin: 45000, buyMax: 60000, rentMin: 2000, rentMax: 3500, condition: "GOOD" },
    { title: "DJ Booth Table", desc: "Professional DJ booth with shelf and LED edge lighting.", features: ["Controller Shelf", "LED Edge Lighting", "Cable Management", "Folding Design", "Travel Case"], buyMin: 25000, buyMax: 35000, rentMin: 800, rentMax: 1500, condition: "LIKE_NEW" },
    { title: "Truss System 3m x 3m", desc: "Aluminum truss for lighting and speaker mounting.", features: ["3x3m Square", "Aluminum Alloy", "Load 200kg", "Modular", "Easy Assembly"], buyMin: 65000, buyMax: 85000, rentMin: 2500, rentMax: 4000, condition: "GOOD" },
    { title: "Yamaha TF3 Digital Mixing Console", desc: "Professional 24-channel digital mixer for live events.", features: ["24 Inputs", "TouchFlow Interface", "1-Knob EQ", "Dante Network", "Built-in FX"], buyMin: 350000, buyMax: 450000, rentMin: 5000, rentMax: 8000, condition: "LIKE_NEW" },
    { title: "Antari Z-1200 II Fog Machine", desc: "High-output fog machine for stage effects and ambiance.", features: ["1200W Heater", "20,000 cfm", "DMX Control", "Timer Remote", "Fast Heat-up"], buyMin: 15000, buyMax: 22000, rentMin: 500, rentMax: 900, condition: "GOOD" },
    { title: "Power Distribution Box (6-way)", desc: "Safe 6-way power distribution for stage and event setups.", features: ["6x 16A Sockets", "32A Input", "Individual MCBs", "LED Indicators", "Heavy-duty Cable"], buyMin: 8000, buyMax: 12000, rentMin: 300, rentMax: 600, condition: "GOOD" },
    { title: "Chauvet COLORband Pix IP65", desc: "Outdoor-rated LED strip light for stage and architectural wash.", features: ["12x 15W LEDs", "IP65 Rated", "Pixel Control", "DMX & D-Fi", "Linkable"], buyMin: 25000, buyMax: 35000, rentMin: 600, rentMax: 1000, condition: "GOOD" },
    { title: "Stage Ramp (Wheelchair Accessible)", desc: "Modular wheelchair ramp for accessible stage setups.", features: ["8ft Long", "24in Wide", "Non-slip Surface", "Side Rails", "Modular Connect"], buyMin: 15000, buyMax: 22000, rentMin: 500, rentMax: 900, condition: "GOOD" },
    { title: "Cable Ramp / Floor Cover (3m)", desc: "Heavy-duty cable protector for event walkways.", features: ["3m Length", "5 Channels", "Load 5000kg", "Yellow Lid", "Modular"], buyMin: 5000, buyMax: 8000, rentMin: 200, rentMax: 400, condition: "GOOD" },
    { title: "Confetti Cannon (Electric)", desc: "Electric confetti cannon for celebrations and event endings.", features: ["Electric Firing", "30m Range", "Multi-color", "CE Certified", "Refillable"], buyMin: 8000, buyMax: 12000, rentMin: 500, rentMax: 1000, condition: "GOOD" },
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

const REVIEW_COMMENTS = [
  "Excellent quality! Highly recommend for any event.",
  "Good condition, delivery was right on time.",
  "Decent product for the price. Would rent again.",
  "Amazing service! The equipment was in perfect condition.",
  "Great value for money. Very professional vendor.",
  "Product was exactly as described. No issues at all.",
  "Slightly worn but worked perfectly for our event.",
  "Top-notch quality. Will definitely come back!",
  "Fair pricing and good customer support throughout.",
  "Equipment exceeded expectations. Superb experience!",
  "Vendor was responsive and accommodating to our needs.",
  "Perfect for our corporate event. Received many compliments.",
  "Renting saved us so much money compared to buying.",
  "Quick pickup and drop-off process. Very smooth.",
  "The AI recommendation was spot-on! Saved us from overspending.",
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
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
  console.log(`Created ${CATEGORIES.length} categories`);

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
        phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
      },
    });
    const vendor = await db.vendor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: v.name,
        phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`,
        address: v.city,
        description: v.desc,
        isVerified: true,
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      },
    });
    vendors.push({ ...vendor, user });
  }
  console.log(`Created ${vendors.length} vendors`);

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
  console.log(`Created ${customers.length} customers`);

  // Create admin users
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
  await db.user.upsert({
    where: { email: "super@rentwise.ai" },
    update: {},
    create: {
      email: "super@rentwise.ai",
      name: "Super Admin",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });
  await db.user.upsert({
    where: { email: "ops@rentwise.ai" },
    update: {},
    create: {
      email: "ops@rentwise.ai",
      name: "Operations Admin",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });
  console.log("Created admin users");

  // Create 500 bookings
  const bookingTypes: ("RENT" | "BUY" | "BOOK")[] = ["RENT", "BUY", "BOOK"];
  const bookingTypeWeights = [60, 25, 15];
  const statuses = ["COMPLETED", "PENDING", "APPROVED", "CONFIRMED", "DELIVERED", "CANCELLED", "RETURNED", "REJECTED"];
  const statusWeights = [30, 20, 15, 10, 10, 8, 5, 2];
  let bookingCount = 0;

  for (let i = 0; i < 500; i++) {
    const customer = pick(customers);
    const product = pick(allProducts);
    const bType = pickWeighted(bookingTypes, bookingTypeWeights);
    const days = rand(1, 14);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rand(0, 90));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    let totalPrice = 0;
    if (bType === "RENT") totalPrice = product.rentPricePerDay * days;
    else if (bType === "BUY") totalPrice = product.buyPrice;
    else totalPrice = product.rentPricePerDay * Math.max(1, Math.floor(days / 2));

    const status = pickWeighted(statuses, statusWeights);

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
      await db.review.create({
        data: {
          userId: customer.id,
          productId: product.id,
          bookingId: booking.id,
          rating: rand(3, 5),
          comment: pick(REVIEW_COMMENTS),
        },
      });
    }
    bookingCount++;
  }
  console.log(`Created ${bookingCount} bookings`);

  // Create AI recommendations
  const aiRecs = [
    { prompt: "DSLR camera for 3 days wedding shoot", recommendation: "RENT", explanation: "Renting a Canon EOS R5 for 3 days costs ₹7,500 vs buying at ₹2,80,000. You save ₹2,72,500 (97.3%) since this is a one-time event.", savings: 272500 },
    { prompt: "Speakers for college tech fest 300 attendees", recommendation: "RENT", explanation: "For a 2-day event, renting JBL VTX system at ₹16,000 is far more economical than buying at ₹5,00,000. Rental saves 96.8%.", savings: 484000 },
    { prompt: "Projector for monthly team presentations", recommendation: "RENT", explanation: "At ₹3,000/month rental vs ₹1,20,000 purchase, renting saves money unless you need it for 40+ months.", savings: 84000 },
    { prompt: "LED Wall for product launch", recommendation: "RENT", explanation: "One-time event — renting P3.9 LED panels at ₹15,000 vs buying at ₹3,50,000 saves 95.7%.", savings: 335000 },
    { prompt: "Microphones for weekly podcast recording", recommendation: "BUY", explanation: "Weekly use over 6+ months makes buying Shure SM58 at ₹9,500 more economical than renting at ₹200/session.", savings: 2400 },
    { prompt: "Stage equipment for annual college fest", recommendation: "RENT", explanation: "Annual 3-day event — renting stage platforms at ₹6,000 vs buying at ₹45,000. Saves 86.7%.", savings: 39000 },
    { prompt: "Lighting for photography studio (6 months)", recommendation: "BUY", explanation: "Daily professional use over 6 months — buying Godox VL300 at ₹50,000 is cheaper than renting at ₹1,200/day (₹2,16,000 total).", savings: 166000 },
    { prompt: "Furniture for wedding reception (1 day)", recommendation: "RENT", explanation: "One-day wedding — renting 100 Chiavari chairs at ₹8,000 vs buying at ₹5,00,000. Saves 98.4%.", savings: 492000 },
    { prompt: "Projector for weekend movie nights (monthly)", recommendation: "RENT", explanation: "Monthly 2-day use at ₹3,000 vs ₹1,20,000 purchase. Renting is economical unless you upgrade to weekly.", savings: 108000 },
    { prompt: "Tent for seasonal outdoor cafe (3 months)", recommendation: "RENT", explanation: "3-month seasonal use — renting a pagoda tent at ₹90,000 vs buying at ₹95,000. Renting avoids storage and maintenance.", savings: 5000 },
    { prompt: "DJI drone for real estate photography (weekly)", recommendation: "BUY", explanation: "Weekly professional use — buying DJI Mavic 3 Pro at ₹3,00,000 vs renting at ₹3,500/week (₹1,82,000/year). Break-even in 18 months.", savings: 118000 },
    { prompt: "Sound system for weekly church service", recommendation: "BUY", explanation: "Weekly recurring use makes buying Bose L1 Pro32 at ₹1,30,000 more economical than renting at ₹3,500/week.", savings: 52000 },
    { prompt: "Decoration items for Diwali corporate party", recommendation: "RENT", explanation: "One-time seasonal event — renting decoration set at ₹3,000 vs buying at ₹25,000. Saves 88%.", savings: 22000 },
    { prompt: "Cameras for 2-day product photoshoot", recommendation: "RENT", explanation: "Short-term commercial shoot — renting Sony A7 IV at ₹4,000 vs buying at ₹2,00,000. Saves 98%.", savings: 196000 },
    { prompt: "Microphones for daily YouTube recording", recommendation: "BUY", explanation: "Daily content creation — buying Rode Wireless GO II at ₹20,000 is far cheaper than ₹400/day rental (₹1,46,000/year).", savings: 126000 },
  ];

  for (const rec of aiRecs) {
    await db.aIRecommendation.create({
      data: {
        prompt: rec.prompt,
        recommendation: rec.recommendation,
        explanation: rec.explanation,
        savings: rec.savings,
      },
    });
  }
  console.log(`Created ${aiRecs.length} AI recommendations`);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n--- Demo Accounts ---");
  console.log("Admin:     admin@rentwise.ai / admin123");
  console.log("Vendor:    progear@rentwise.ai / vendor123");
  console.log("Customer:  arjun.sharma@email.com / customer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());