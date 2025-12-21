import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const subscriptionPlans = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for small cooperatives just getting started',
    monthlyPrice: 0, // Free
    yearlyPrice: 0,
    maxMembers: 20,
    maxContributionPlans: 1,
    maxLoansPerMonth: 0, // Disabled
    maxGroupBuys: 0, // Disabled
    features: [
      'Up to 20 members',
      '1 contribution plan',
      'Basic ledger tracking',
      'Email notifications',
      'Mobile app access',
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    name: 'starter',
    displayName: 'Starter',
    description: 'Great for growing cooperatives with more needs',
    monthlyPrice: 500000, // ₦5,000 in kobo
    yearlyPrice: 4800000, // ₦48,000/year (20% discount)
    maxMembers: 100,
    maxContributionPlans: 5,
    maxLoansPerMonth: 10,
    maxGroupBuys: 3,
    features: [
      'Up to 100 members',
      '5 contribution plans',
      'Loan management (10/month)',
      '3 active group buys',
      'Advanced ledger & reports',
      'Push notifications',
      'Priority email support',
    ],
    isActive: true,
    isPopular: true, // Recommended
    sortOrder: 2,
  },
  {
    name: 'business',
    displayName: 'Business',
    description: 'For established cooperatives with comprehensive needs',
    monthlyPrice: 1500000, // ₦15,000 in kobo
    yearlyPrice: 14400000, // ₦144,000/year (20% discount)
    maxMembers: 500,
    maxContributionPlans: 20,
    maxLoansPerMonth: 50,
    maxGroupBuys: 10,
    features: [
      'Up to 500 members',
      '20 contribution plans',
      'Loan management (50/month)',
      '10 active group buys',
      'Full ledger & financial reports',
      'Push & SMS notifications',
      'Export data (CSV, PDF)',
      'Priority phone support',
      'Dedicated account manager',
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 3,
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'Custom solution for large cooperatives and federations',
    monthlyPrice: 5000000, // ₦50,000 in kobo (contact for custom)
    yearlyPrice: 48000000, // ₦480,000/year
    maxMembers: 10000, // Effectively unlimited
    maxContributionPlans: 100,
    maxLoansPerMonth: 500,
    maxGroupBuys: 50,
    features: [
      'Unlimited members',
      'Unlimited contribution plans',
      'Unlimited loans',
      'Unlimited group buys',
      'White-label branding',
      'API access',
      'Custom integrations',
      'Multi-cooperative management',
      'Dedicated infrastructure',
      '24/7 premium support',
      'On-site training',
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
];

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  for (const plan of subscriptionPlans) {
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { name: plan.name },
    });

    if (existing) {
      // Update existing plan
      await prisma.subscriptionPlan.update({
        where: { name: plan.name },
        data: plan,
      });
      console.log(`✅ Updated plan: ${plan.displayName}`);
    } else {
      // Create new plan
      await prisma.subscriptionPlan.create({
        data: plan,
      });
      console.log(`✅ Created plan: ${plan.displayName}`);
    }
  }

  console.log('\n🎉 Subscription plans seeded successfully!');
  
  // Display summary
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  console.log('\n📋 Available Plans:');
  console.log('─'.repeat(60));
  
  for (const plan of plans) {
    const monthlyPrice = plan.monthlyPrice === 0 ? 'Free' : `₦${(plan.monthlyPrice / 100).toLocaleString()}/mo`;
    const yearlyPrice = plan.yearlyPrice === 0 ? '' : ` (₦${(plan.yearlyPrice / 100).toLocaleString()}/yr)`;
    console.log(`${plan.displayName.padEnd(12)} | ${monthlyPrice}${yearlyPrice}`);
    console.log(`             | Members: ${plan.maxMembers}, Plans: ${plan.maxContributionPlans}, Loans: ${plan.maxLoansPerMonth}/mo`);
    console.log('─'.repeat(60));
  }
}

async function main() {
  console.log('🚀 Starting database seed...\n');
  
  // Seed subscription plans
  await seedSubscriptionPlans();
  
  console.log('\n✅ All seeds completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
