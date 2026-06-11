require('dotenv').config();
const { db } = require('../config/firebase');

const MENU = {
  'CHICKEN': [
    { id:1,  name:'Chicken Burger',              price:3500, badge:'hot',     image:'assets/CB.jpg?v=1' },
    { id:2,  name:'Chicken Burger & Chips',      price:4000, badge:null,      image:'assets/CBC.jpg?v=1' },
    { id:3,  name:'Double Chicken Burger&Chips', price:5000, badge:'popular', image:'assets/DCBC.jpg?v=1' },
    { id:4,  name:'Chicken Fries',               price:3000, badge:null,      image:'assets/CF.jpg?v=1' },
    { id:5,  name:'Omelette Burger & Chips',     price:3000, badge:'new',     image:'assets/OB.jpg?v=1' },
    { id:6,  name:'Chicken Wrap',                price:3000, badge:'new',     image:'assets/CW.jpg?v=1' },
    { id:11, name:'Shawarma',                    price:3000, badge:'new',     image:'assets/S.jpg?v=1' },
  ],
  'BEEF': [
    { id:7,  name:'Beef Burger',                 price:3000, badge:'popular', image:'assets/BB.jpg?v=1' },
    { id:8,  name:'Beef Burger & Chips',         price:3500, badge:null,      image:'assets/BBC.jpg?v=1' },
    { id:9,  name:'Double Beef Burger & Chips',  price:4500, badge:'hot',     image:'assets/DBBC.jpg?v=1' },
    { id:10, name:'Beef Fries',                  price:2500, badge:'new',     image:'assets/BF.jpg?v=1' },
  ],
  Extras: [
    { id:14, name:'Sauces', price:1000, badge:'new',  image:'assets/SC.jpg?v=1' },
    { id:15, name:'Cheese', price:500,  badge:null,   image:'assets/CH.jpg?v=1' },
    { id:16, name:'Fanta',  price:1200, badge:null,   image:'assets/FA.jpg?v=1' },
    { id:17, name:'Chips',  price:2000, badge:'new',  image:'assets/CP.jpg?v=1' },
  ],
  BoxCombos: [
    { id:19, name:'Chicken Burger & Chips & Fanta',        price:5200, badge:null,      image:'assets/CBCF.jpg?v=1' },
    { id:20, name:'Double Chicken Burger & Chips & Fanta', price:4200, badge:'popular', image:'assets/DCBCF.jpg?v=1' },
    { id:21, name:'Chicken Fries & Fanta',                 price:4200, badge:'new',     image:'assets/boo.png?v=1' },
    { id:22, name:'Beef Burger & Chips & Fanta',           price:4700, badge:null,      image:'assets/BBCF.jpg?v=1' },
    { id:23, name:'Double Beef Burger & Chips & Fanta',    price:5700, badge:null,      image:'assets/Y.png?v=1' },
    { id:24, name:'Beef Fries & Fanta',                    price:3700, badge:'new',     image:'assets/COA.png?v=1' },
  ],
  Promotion: [
    { id:25, name:'2 Burgers & 2 Chips',           price:6000,  badge:'hot',     image:'assets/baga.png?v=1' },
    { id:26, name:'4 Beef Burger & 4 Chips',        price:10000, badge:'popular', image:'assets/promo1.png?v=1' },
    { id:27, name:'4 Chicken Burger & 4 Chips',      price:12000, badge:'new',     image:'assets/promo2.png?v=1' },
  ],
};

async function seedProducts() {
  console.log("🌱 Seeding products...");
  const batch = db.batch();

  for (const category in MENU) {
    MENU[category].forEach(item => {
      const docRef = db.collection('products').doc();
      batch.set(docRef, {
        ...item,
        category: category,
        createdAt: new Date()
      });
    });
  }

  await batch.commit();
  console.log("✅ Products seeded successfully.");
  process.exit(0);
}

seedProducts().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
