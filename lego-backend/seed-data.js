// Seed script to populate database with initial template data
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection string
const MONGO_URL = 'mongodb://localhost:27017/lego';

// Read test work data
const testWorkData = JSON.parse(fs.readFileSync(path.join(__dirname, 'testWork.json'), 'utf8'));

// Define Work schema (simplified version)
const WorkSchema = new mongoose.Schema({
  id: Number,
  uuid: String,
  title: String,
  desc: String,
  coverImg: String,
  content: Object,
  isTemplate: Boolean,
  isPublic: Boolean,
  isHot: Boolean,
  author: String,
  copiedCount: { type: Number, default: 0 },
  status: { type: Number, default: 2 },
  latestPublishAt: Date,
  channels: Array
}, { timestamps: true });

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const Work = mongoose.model('Work', WorkSchema);

    // Check if templates already exist
    const existingCount = await Work.countDocuments({ isTemplate: true });
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} templates. Skipping seed.`);
      await mongoose.connection.close();
      return;
    }

    // Create sample templates
    const templates = [
      {
        id: 1,
        uuid: 'tpl001',
        title: '前端架构师直播海报',
        desc: '如何突破前端成长瓶颈？三位大厂架构师为你制定职业晋级方案',
        coverImg: 'http://static.imooc-lego.com/upload-files/screenshot-677311.png',
        content: testWorkData,
        isTemplate: true,
        isPublic: true,
        isHot: true,
        author: '慕课网',
        copiedCount: 128,
        status: 2,
        latestPublishAt: new Date()
      },
      {
        id: 2,
        uuid: 'tpl002',
        title: '技术分享会海报',
        desc: '企业级前端架构设计与实践分享',
        coverImg: 'http://static.imooc-lego.com/upload-files/screenshot-677311.png',
        content: testWorkData,
        isTemplate: true,
        isPublic: true,
        isHot: false,
        author: '慕课网',
        copiedCount: 56,
        status: 2,
        latestPublishAt: new Date()
      },
      {
        id: 3,
        uuid: 'tpl003',
        title: '产品发布会邀请函',
        desc: '新产品发布会邀请函模板',
        coverImg: 'http://static.imooc-lego.com/upload-files/screenshot-677311.png',
        content: testWorkData,
        isTemplate: true,
        isPublic: true,
        isHot: true,
        author: '慕课网',
        copiedCount: 89,
        status: 2,
        latestPublishAt: new Date()
      },
      {
        id: 4,
        uuid: 'tpl004',
        title: '活动宣传海报',
        desc: '线上活动宣传海报模板',
        coverImg: 'http://static.imooc-lego.com/upload-files/screenshot-677311.png',
        content: testWorkData,
        isTemplate: true,
        isPublic: true,
        isHot: false,
        author: '慕课网',
        copiedCount: 42,
        status: 2,
        latestPublishAt: new Date()
      }
    ];

    console.log('Inserting template data...');
    await Work.insertMany(templates);
    console.log(`Successfully inserted ${templates.length} templates`);

    // Also need to set up the counter for auto-increment
    const CounterSchema = new mongoose.Schema({
      id: String,
      seq: Number
    });
    const Counter = mongoose.model('Counter', CounterSchema);
    
    await Counter.findOneAndUpdate(
      { id: 'works_id_counter' },
      { seq: templates.length },
      { upsert: true, new: true }
    );
    console.log('Counter initialized');

    await mongoose.connection.close();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
