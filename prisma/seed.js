const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const jobs = [
  {
    title: 'Customer Support Specialist',
    company: 'North Harbor Solutions',
    location: 'Remote',
    remote: true,
    description: 'Help customers troubleshoot issues and build trust while supporting inclusive service experiences.',
    requirements: ['Customer service', 'Problem solving', 'Strong communication'],
    salaryRange: '$42k - $55k',
  },
  {
    title: 'Warehouse Operations Coordinator',
    company: 'Greenline Logistics',
    location: 'Chicago, IL',
    remote: false,
    description: 'Coordinate inventory flow, shipping details, and team routines for a fast-moving logistics operation.',
    requirements: ['Inventory coordination', 'Safety awareness', 'Scheduling'],
    salaryRange: '$38k - $48k',
  },
  {
    title: 'Administrative Assistant',
    company: 'Civic Pathways',
    location: 'Hybrid',
    remote: false,
    description: 'Provide scheduling, records support, and client intake services for a mission-driven nonprofit team.',
    requirements: ['Admin support', 'Organized workflow', 'Documentation'],
    salaryRange: '$36k - $45k',
  },
  {
    title: 'Production Associate',
    company: 'Summit Manufacturing',
    location: 'Columbus, OH',
    remote: false,
    description: 'Support production lines, quality checks, and packaging workflow in a steady-paced manufacturing environment.',
    requirements: ['Attention to detail', 'Teamwork', 'Safety compliance'],
    salaryRange: '$40k - $50k',
  },
  {
    title: 'Hospitality Front Desk Agent',
    company: 'Harborview Hotel Group',
    location: 'Remote-friendly',
    remote: true,
    description: 'Welcome guests and manage room assignments and communications in a customer-first hospitality environment.',
    requirements: ['Front desk experience', 'Hospitality mindset', 'Multitasking'],
    salaryRange: '$35k - $44k',
  },
];

async function main() {
  for (const job of jobs) {
    const existing = await prisma.jobListing.findFirst({
      where: {
        title: job.title,
        company: job.company,
      },
    });

    if (existing) {
      await prisma.jobListing.update({
        where: { id: existing.id },
        data: job,
      });
      continue;
    }

    await prisma.jobListing.create({ data: job });
  }

  console.log(`Seeded ${jobs.length} job listings.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
