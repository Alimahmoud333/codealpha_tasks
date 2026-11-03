/*
 * Sample data for the social module. Everything here is fictional.
 * All sample accounts use the password from SEED_DEMO_PASSWORD in your .env.
 */

export const sampleUsers = [
  { username: "demo_customer", name: "Demo Customer", email: "demo.customer@example.com", bio: "Trying out the shop and the community." },
  { username: "ana_rivera", name: "Ana Rivera", email: "ana.rivera@example.com", bio: "Trail guide writer. Long walks, short itineraries." },
  { username: "omar_haddad", name: "Omar Haddad", email: "omar.haddad@example.com", bio: "Product designer who still prefers paper notebooks." },
  { username: "lina_khoury", name: "Lina Khoury", email: "lina.khoury@example.com", bio: "Leatherworker. Restoring old bags in a small studio." },
  { username: "jonas_weber", name: "Jonas Weber", email: "jonas.weber@example.com", bio: "Backend developer. Opinions about database schemas." },
  { username: "mei_tanaka", name: "Mei Tanaka", email: "mei.tanaka@example.com", bio: "Street photography, film cameras, early mornings." },
  { username: "sam_okafor", name: "Sam Okafor", email: "sam.okafor@example.com", bio: "Bike mechanic. Slow travel enthusiast." },
];

/* hoursAgo spreads the posts over time so the feed has a realistic order. */
export const samplePosts = [
  { by: "ana_rivera", hoursAgo: 70, content: "Finished the first draft of the trail guide for the coastal route. Eleven stages, about 140 km, and a surprising number of good bakeries along the way." },
  { by: "omar_haddad", hoursAgo: 64, content: "Anyone else switching to a single-notebook system this year? Two weeks in and I haven't lost a single to-do yet." },
  { by: "lina_khoury", hoursAgo: 58, content: "Spent the weekend restoring an old leather satchel. Saddle soap, patience, and a lot of neatsfoot oil. Worth every minute." },
  { by: "jonas_weber", hoursAgo: 50, content: "Reminder that a boring database schema with proper constraints will outlive any clever one." },
  { by: "mei_tanaka", hoursAgo: 44, content: "Walked the Sunday market route at sunrise. Streets completely empty, the whole district smelled of fresh bread." },
  { by: "sam_okafor", hoursAgo: 38, content: "New here. I mostly write about bike repair and slow travel, happy to swap tips with anyone." },
  { by: "ana_rivera", hoursAgo: 30, content: "Packing list for a four-day hike: waterproof layer, spare socks, a small stove, and far less than you think you need." },
  { by: "omar_haddad", hoursAgo: 24, content: "Tried writing notes by hand during meetings for a month. My recall improved more than I expected." },
  { by: "lina_khoury", hoursAgo: 18, content: "Small workshop update: the new cutting table is in and the room finally feels like a studio." },
  { by: "jonas_weber", hoursAgo: 12, content: "A code review habit that helped me most: read the tests first, then the implementation." },
  { by: "mei_tanaka", hoursAgo: 7, content: "Found a second-hand film camera at the flea market. The shutter is stiff but the lens is clean." },
  { by: "sam_okafor", hoursAgo: 3, content: "Chain lube is not a personality, but I will happily talk about it for an hour." },
];

/* post = index in samplePosts */
export const sampleComments = [
  { post: 0, by: "omar_haddad", hoursAgo: 68, content: "Eleven stages sounds ideal. Will the guide include the bakery list?" },
  { post: 0, by: "ana_rivera", hoursAgo: 67, content: "It will. Chapter four has a full bakery map." },
  { post: 2, by: "sam_okafor", hoursAgo: 55, content: "Great result. What do you use on the brass fittings?" },
  { post: 3, by: "ana_rivera", hoursAgo: 48, content: "Same goes for itineraries. Boring and well-structured wins." },
  { post: 4, by: "lina_khoury", hoursAgo: 42, content: "I know exactly which street you mean. The smell is unbeatable." },
  { post: 5, by: "jonas_weber", hoursAgo: 36, content: "Welcome! Please post the chain-cleaning routine when you have time." },
  { post: 7, by: "demo_customer", hoursAgo: 22, content: "I'm going to try this next week." },
  { post: 9, by: "demo_customer", hoursAgo: 10, content: "Reading the tests first is such a simple idea. Thanks for sharing." },
  { post: 10, by: "sam_okafor", hoursAgo: 5, content: "A stiff shutter usually just needs a careful service. Worth keeping." },
  { post: 11, by: "mei_tanaka", hoursAgo: 2, content: "Please do. I need advice on my bicycle chain." },
];

/* post = index in samplePosts, users = who liked it */
export const sampleLikes = [
  { post: 0, users: ["omar_haddad", "lina_khoury", "sam_okafor", "demo_customer"] },
  { post: 1, users: ["ana_rivera", "jonas_weber"] },
  { post: 2, users: ["ana_rivera", "mei_tanaka", "demo_customer"] },
  { post: 3, users: ["ana_rivera", "omar_haddad", "sam_okafor"] },
  { post: 4, users: ["lina_khoury", "ana_rivera"] },
  { post: 5, users: ["ana_rivera", "jonas_weber", "lina_khoury"] },
  { post: 6, users: ["sam_okafor", "demo_customer"] },
  { post: 7, users: ["ana_rivera"] },
  { post: 9, users: ["omar_haddad", "demo_customer", "mei_tanaka"] },
  { post: 10, users: ["lina_khoury", "ana_rivera", "sam_okafor"] },
  { post: 11, users: ["mei_tanaka", "jonas_weber"] },
];

/* [follower, following] */
export const sampleFollows = [
  ["demo_customer", "ana_rivera"],
  ["demo_customer", "omar_haddad"],
  ["demo_customer", "lina_khoury"],
  ["ana_rivera", "omar_haddad"],
  ["ana_rivera", "mei_tanaka"],
  ["omar_haddad", "ana_rivera"],
  ["omar_haddad", "jonas_weber"],
  ["lina_khoury", "ana_rivera"],
  ["lina_khoury", "mei_tanaka"],
  ["jonas_weber", "omar_haddad"],
  ["mei_tanaka", "ana_rivera"],
  ["mei_tanaka", "lina_khoury"],
  ["sam_okafor", "ana_rivera"],
  ["sam_okafor", "mei_tanaka"],
];
