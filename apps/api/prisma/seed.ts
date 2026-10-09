import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const photo = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

async function main() {
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.user.deleteMany();

  const adminHash = await bcrypt.hash("Nestfab@2026", 12);
  const customerHash = await bcrypt.hash("Customer@2026", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Nestfab Admin",
      email: "admin@nestfab.in",
      passwordHash: adminHash,
      phone: "9800000000",
      role: "ADMIN",
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: "Priya Shah",
      email: "priya.shah@example.com",
      passwordHash: customerHash,
      phone: "9845011122",
      role: "CUSTOMER",
      addresses: {
        create: {
          fullName: "Priya Shah",
          phone: "9845011122",
          line1: "B-204, Cedar Residency",
          line2: "Baner",
          city: "Pune",
          state: "Maharashtra",
          pincode: "411045",
          isDefault: true,
        },
      },
    },
  });

  const kitchen = await prisma.category.create({
    data: {
      name: "Kitchenware",
      slug: "kitchenware",
      description: "Pans, tawas, and tools built for the heat and pace of an Indian kitchen.",
      imageUrl: photo("photo-1556911220-e15b29be8c8f"),
    },
  });

  const doors = await prisma.category.create({
    data: {
      name: "Door Guards",
      slug: "door-guards",
      description: "Seals, stops, and guards that keep dust, drafts, and slammed doors in check.",
      imageUrl: photo("photo-1505691938895-1758d7feb511"),
    },
  });

  const storage = await prisma.category.create({
    data: {
      name: "Storage",
      slug: "storage",
      description: "Jars and tins that make a small kitchen feel orderly.",
      imageUrl: photo("photo-1610701596007-11502861dcfa"),
    },
  });

  const products = [
    {
      name: "Tri-Ply Stainless Kadai, 24 cm",
      slug: "tri-ply-stainless-kadai-24",
      sku: "NF-KADAI-24",
      pricePaise: 249900,
      compareAtPaise: 319900,
      stock: 42,
      categoryId: kitchen.id,
      featured: true,
      codAllowed: false,
      material: "Tri-ply stainless steel",
      weight: "1.4 kg",
      dimensions: "24 cm diameter, 8 cm deep",
      care: "Hand wash is kinder to the finish. The body is dishwasher-safe. Avoid steel wool on the outside.",
      description:
        "A daily kadai for tadka, sabzi, and shallow frying. The tri-ply body has stainless steel on the cooking surface and the outside, with an aluminium core that spreads heat so the centre does not scorch while the edges stay cold. It sits flat on gas and induction, and the helper handle lets you lift it one-handed when it is full of potatoes.",
      highlights: [
        "Tri-ply steel with an aluminium core",
        "Works on gas, induction, and ceramic",
        "Stay-cool handles with a helper grip",
        "Oven safe up to 180°C without the lid knob",
      ],
      images: [
        { url: photo("photo-1556910103-1c02745aae4d"), alt: "Stainless cookware on a warm kitchen counter" },
        { url: photo("photo-1556909114-f6e7ad7d3136"), alt: "A home kitchen prepared for cooking" },
      ],
    },
    {
      name: "Hard-Anodised Dosa Tawa, 30 cm",
      slug: "hard-anodised-dosa-tawa-30",
      sku: "NF-TAWA-30",
      pricePaise: 129900,
      compareAtPaise: 169900,
      stock: 36,
      categoryId: kitchen.id,
      featured: true,
      material: "Hard-anodised aluminium",
      weight: "780 g",
      dimensions: "30 cm cooking surface",
      care: "Season with a few drops of oil before the first use. Wash with a soft sponge. Do not quench a hot tawa under cold water.",
      description:
        "A flat tawa for dosa, uttapam, chilla, and rotis that need an even face. Hard anodising gives the aluminium a dense dark surface that holds a light season and resists warping on a domestic burner. The low rim keeps a dosa spreadable while still catching a little oil.",
      highlights: [
        "Even heat across a 30 cm face",
        "Low rim for spreading dosa batter",
        "Suitable for gas and induction with a plate",
        "Light enough to lift off the burner with one hand",
      ],
      images: [{ url: photo("photo-1668236543090-82eba5ee5976"), alt: "Dosa cooking on a flat tawa" }],
    },
    {
      name: "Copper-Bottom Milk Pan, 1.5 L",
      slug: "copper-bottom-milk-pan",
      sku: "NF-MILK-15",
      pricePaise: 89900,
      compareAtPaise: 119900,
      stock: 58,
      categoryId: kitchen.id,
      featured: false,
      material: "Stainless steel with a copper-clad base",
      weight: "640 g",
      dimensions: "1.5 litre, 16 cm diameter",
      care: "The copper base will darken with heat. A lemon-and-salt rub brings the shine back. Do not soak the base overnight.",
      description:
        "A small pan for milk, chai, and single portions of dal. The copper-clad base picks up heat quickly on gas, which is what you want when you are watching milk and do not want to stand there for ten minutes. A pouring lip on each side keeps the last of the chai off the hob.",
      highlights: [
        "1.5 litre, right for two cups of chai or a small dal",
        "Copper-clad base for fast heat on gas",
        "Twin pouring lips",
        "Lid included",
      ],
      images: [{ url: photo("photo-1590794056226-79ef3a8147e1"), alt: "A small saucepan in a home kitchen" }],
    },
    {
      name: "Bamboo Cooking Tools, set of 5",
      slug: "bamboo-cooking-tools",
      sku: "NF-TOOL-05",
      pricePaise: 74900,
      compareAtPaise: null,
      stock: 64,
      categoryId: kitchen.id,
      featured: false,
      material: "Natural bamboo",
      weight: "280 g for the set",
      dimensions: "Tools from 30 cm to 35 cm",
      care: "Hand wash and stand upright to dry. Oil lightly with coconut oil if the bamboo starts to look dry. Not for the dishwasher.",
      description:
        "Five tools for a non-stick and stainless kitchen: a slotted spoon, a solid spoon, a corner spatula, a scraper, and a pair of tongs. Bamboo stays quiet against a kadai and does not scratch a seasoned or non-stick surface the way steel will. The handles are left long so your knuckles stay off the rim.",
      highlights: [
        "Five pieces: spoons, spatula, scraper, tongs",
        "Kind to non-stick and seasoned pans",
        "Long handles for deep kadhais",
        "No paint, no plastic heads",
      ],
      images: [{ url: photo("photo-1556911220-bff31c812dba"), alt: "Wooden cooking tools on a counter" }],
    },
    {
      name: "Silicone Turner and Spatula Set",
      slug: "silicone-turner-spatula-set",
      sku: "NF-SIL-03",
      pricePaise: 49900,
      compareAtPaise: null,
      stock: 80,
      categoryId: kitchen.id,
      featured: false,
      material: "Food-grade silicone, nylon core",
      weight: "210 g",
      dimensions: "Set of 3",
      care: "Dishwasher safe on the top rack. The heads are heat safe for stovetop use. Do not leave them resting in a hot pan.",
      description:
        "A small set for eggs, dosas that need lifting, and the corner of a kadhai where a straight spoon cannot reach. The silicone is firm enough to flip and soft enough to leave a non-stick coating alone. Hanging holes mean they do not live in a wet drawer.",
      highlights: [
        "Turner, spoon spatula, and jar scraper",
        "One-piece silicone heads",
        "Heat safe for stovetop cooking",
        "Hanging holes on each handle",
      ],
      images: [{ url: photo("photo-1466637574441-749b8f19452f"), alt: "Kitchen tools beside spices" }],
    },
    {
      name: "Borosilicate Jar Trio",
      slug: "borosilicate-jar-trio",
      sku: "NF-JAR-03",
      pricePaise: 114900,
      compareAtPaise: 149900,
      stock: 28,
      categoryId: storage.id,
      featured: true,
      material: "Borosilicate glass, bamboo lids",
      weight: "1.1 kg",
      dimensions: "400 ml, 700 ml, and 1000 ml",
      care: "The glass is dishwasher safe. Wash bamboo lids by hand and dry them off the jar so they do not swell.",
      description:
        "Three clear jars for dal, rice, and the snacks that otherwise live in torn packets. Borosilicate glass takes a warm wash without clouding, and the bamboo lids have a silicone ring so semolina does not find its way into the drawer. Sizes stack, which matters when the shelf is one row deep.",
      highlights: [
        "400 ml, 700 ml, and 1 litre",
        "Airtight silicone ring under each lid",
        "Stackable, square-shouldered shape",
        "Glass is fridge and microwave safe without the lid",
      ],
      images: [{ url: photo("photo-1610701596007-11502861dcfa"), alt: "Glass storage jars on a kitchen shelf" }],
    },
    {
      name: "Twin Draft Door Guard, 90 cm",
      slug: "twin-draft-door-guard-90",
      sku: "NF-DRAFT-90",
      pricePaise: 64900,
      compareAtPaise: 89900,
      stock: 74,
      categoryId: doors.id,
      featured: true,
      material: "Filled cotton sleeve, non-slip base",
      weight: "700 g",
      dimensions: "Fits doors up to 90 cm wide",
      care: "Spot clean. The sleeve unzips if you ever need to restuff it. Keep it dry through the monsoon.",
      description:
        "A twin-sided draft guard that slides under the door and moves with it, so you are not resetting a sausage roll every time someone walks in. It blocks the gap that pulls dust under a main door and the gap that lets a bedroom air conditioner leak into the hall. The underside is a thin non-slip strip, not a bulky wedge.",
      highlights: [
        "Covers both sides of the door",
        "Moves with the door instead of sitting in the way",
        "Fits doors up to 90 cm",
        "Cuts dust, light gaps, and cooled-air leaks",
      ],
      images: [{ url: photo("photo-1505691938895-1758d7feb511"), alt: "A quiet bedroom door in warm light" }],
    },
    {
      name: "Under-Door Seal Strip, 100 cm",
      slug: "under-door-seal-strip",
      sku: "NF-SEAL-100",
      pricePaise: 39900,
      compareAtPaise: null,
      stock: 110,
      categoryId: doors.id,
      featured: false,
      material: "Silicone seal, adhesive backing",
      weight: "180 g",
      dimensions: "100 cm, trims with scissors",
      care: "Wipe the door bottom clean and dry before sticking. Press for a full minute. It reaches full hold after 24 hours.",
      description:
        "A self-adhesive silicone seal for the bottom of a bathroom or balcony door. Trim it with scissors to the door width. It closes the slit that lets bathroom humidity and balcony dust into the room, without the look of a screwed-on metal threshold.",
      highlights: [
        "Trims to width with household scissors",
        "Adhesive backing, no drilling",
        "Flexible silicone that still lets the door close",
        "Useful on bathroom and balcony doors",
      ],
      images: [{ url: photo("photo-1600585154340-be6161a56a0c"), alt: "A bright home interior with a closed door" }],
    },
    {
      name: "Finger-Pinch Hinge Guards, set of 4",
      slug: "finger-pinch-hinge-guards",
      sku: "NF-HINGE-04",
      pricePaise: 29900,
      compareAtPaise: null,
      stock: 96,
      categoryId: doors.id,
      featured: false,
      material: "Flexible EVA foam",
      weight: "120 g",
      dimensions: "Covers a standard hinge side, set of 4",
      care: "Wipe with a damp cloth. The foam slides off if you need to paint the frame.",
      description:
        "Soft guards that cover the hinge side of a door, where little fingers otherwise find the gap as the door closes. They flex with the door and need no screws. A set of four is enough for the rooms you actually worry about: the child room, the bathroom, and the door that slams in a cross-breeze.",
      highlights: [
        "Set of four hinge-side guards",
        "Slides on, no tools",
        "Flexes as the door opens and closes",
        "Foam that wipes clean",
      ],
      images: [{ url: photo("photo-1600121848594-d8644e57abab"), alt: "A home doorway in soft daylight" }],
    },
    {
      name: "Heavy Floor Door Wedge",
      slug: "heavy-floor-door-wedge",
      sku: "NF-WEDGE-01",
      pricePaise: 24900,
      compareAtPaise: null,
      stock: 120,
      categoryId: doors.id,
      featured: false,
      material: "Zinc alloy body, rubber grip",
      weight: "340 g",
      dimensions: "12 cm long",
      care: "The rubber face can be rinsed. Dry it before putting it back on a wooden floor.",
      description:
        "A heavy wedge for doors that will not stay open: the balcony door while you water plants, the kitchen door while you carry a kadhai through. The rubber face grips tile and stone. The body has enough weight that a breeze does not kick it aside.",
      highlights: [
        "Heavy body that stays where you put it",
        "Rubber face for tile and stone",
        "Useful while carrying things through a doorway",
        "No installation",
      ],
      images: [{ url: photo("photo-1600210492486-724fe5c67fb0"), alt: "A modern home interior doorway" }],
    },
    {
      name: "Magnetic Door Stop",
      slug: "magnetic-door-stop",
      sku: "NF-MAG-01",
      pricePaise: 34900,
      compareAtPaise: null,
      stock: 70,
      categoryId: doors.id,
      featured: false,
      material: "Stainless catch, magnetic strike",
      weight: "160 g",
      dimensions: "Floor or skirting mount",
      care: "Tighten the screw after the first week. Wipe the magnet if paint dust collects on it.",
      description:
        "A magnetic catch that holds a door open against the skirting, then releases when you pull. It is the quieter alternative to a door that bounces off a wall and marks the paint. Screws are included for a floor or skirting fix.",
      highlights: [
        "Holds the door open with a magnet",
        "Releases with a normal pull",
        "Saves the wall from the door handle",
        "Screws included",
      ],
      images: [{ url: photo("photo-1600585152220-90363fe7e115"), alt: "A calm living space with a wooden door" }],
    },
  ];

  const created = [];
  for (const product of products) {
    const { images, ...data } = product;
    created.push(
      await prisma.product.create({
        data: {
          ...data,
          images: { create: images.map((image, index) => ({ ...image, sortOrder: index })) },
        },
      }),
    );
  }

  const kadai = created.find((product) => product.slug === "tri-ply-stainless-kadai-24")!;
  const draft = created.find((product) => product.slug === "twin-draft-door-guard-90")!;

  await prisma.order.create({
    data: {
      orderNumber: "NF2610DEMO01",
      accessToken: "seed-order-access-token",
      userId: priya.id,
      email: priya.email,
      phone: priya.phone!,
      status: "DELIVERED",
      paymentStatus: "PAID",
      paymentMethod: "RAZORPAY",
      subtotalPaise: kadai.pricePaise + draft.pricePaise,
      discountPaise: 0,
      shippingPaise: 0,
      totalPaise: kadai.pricePaise + draft.pricePaise,
      shippingName: "Priya Shah",
      shippingLine1: "B-204, Cedar Residency",
      shippingLine2: "Baner",
      shippingCity: "Pune",
      shippingState: "Maharashtra",
      shippingPincode: "411045",
      items: {
        create: [
          {
            productId: kadai.id,
            name: kadai.name,
            sku: kadai.sku,
            pricePaise: kadai.pricePaise,
            quantity: 1,
            imageUrl: photo("photo-1556910103-1c02745aae4d"),
          },
          {
            productId: draft.id,
            name: draft.name,
            sku: draft.sku,
            pricePaise: draft.pricePaise,
            quantity: 1,
            imageUrl: photo("photo-1505691938895-1758d7feb511"),
          },
        ],
      },
    },
  });

  await prisma.review.createMany({
    data: [
      {
        productId: kadai.id,
        userId: priya.id,
        rating: 5,
        title: "Does not hot-spot the tadka",
        body: "I use this most evenings for sabzi. Heat is even, the helper handle is not a toy, and it has not warped on my induction plate.",
      },
      {
        productId: draft.id,
        userId: priya.id,
        rating: 4,
        title: "Stays with the door",
        body: "The bedroom AC used to leak under the door. This moves when the door moves, which the old stuffed snake never did. Took a day to sit flat.",
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "WELCOME10",
        description: "10% off a first direct order",
        type: "PERCENT",
        value: 10,
        minOrderPaise: 0,
        active: true,
      },
      {
        code: "NEST50",
        description: "₹50 off orders of ₹499 and above",
        type: "FLAT",
        value: 5000,
        minOrderPaise: 49900,
        active: true,
      },
    ],
  });

  console.log(`Seeded Nestfab catalog (${created.length} products). Admin: admin@nestfab.in`);
  console.log("Customer demo: priya.shah@example.com");
  void admin;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
