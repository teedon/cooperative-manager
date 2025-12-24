import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Wallet,
  BookOpen,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchCooperatives } from '@/store/slices/cooperativeSlice';
import { Card, CardBody, CardHeader, Badge, Spinner } from '@/components/common';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  link: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  link,
}) => (
  <Link to={link}>
    <Card hoverable className="h-full">
      <CardBody>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">{title}</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">
              {value}
            </p>
            {change && (
              <div className="flex items-center mt-2">
                {changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4 text-[var(--color-success-main)]" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-[var(--color-error-main)]" />
                )}
                <span
                  className={`text-sm ml-1 ${
                    changeType === 'positive'
                      ? 'text-[var(--color-success-main)]'
                      : 'text-[var(--color-error-main)]'
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-primary-light)]">
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  </Link>
);

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { cooperatives, loading } = useAppSelector((state) => state.cooperative);

  useEffect(() => {
    dispatch(fetchCooperatives());
  }, [dispatch]);

  const stats = [
    {
      title: 'Total Cooperatives',
      value: cooperatives.length.toString(),
      change: '+2 this month',
      changeType: 'positive' as const,
      icon: <Users className="w-6 h-6 text-[var(--color-primary-main)]" />,
      link: '/cooperatives',
    },
    {
      title: 'Total Contributions',
      value: '₦1,250,000',
      change: '+15%',
      changeType: 'positive' as const,
      icon: <Wallet className="w-6 h-6 text-[var(--color-primary-main)]" />,
      link: '/contributions',
    },
    {
      title: 'Active Loans',
      value: '3',
      change: '1 pending',
      changeType: 'negative' as const,
      icon: <BookOpen className="w-6 h-6 text-[var(--color-primary-main)]" />,
      link: '/loans',
    },
    {
      title: 'Group Buys',
      value: '5',
      change: '+3 new',
      changeType: 'positive' as const,
      icon: <ShoppingBag className="w-6 h-6 text-[var(--color-primary-main)]" />,
      link: '/group-buys',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Here's what's happening with your cooperatives today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Cooperatives */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              My Cooperatives
            </h2>
            <Link
              to="/cooperatives"
              className="text-sm text-[var(--color-primary-main)] hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : cooperatives.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-[var(--color-text-disabled)]" />
                <p className="mt-2 text-[var(--color-text-secondary)]">
                  No cooperatives yet
                </p>
                <Link
                  to="/cooperatives/new"
                  className="mt-4 inline-block text-[var(--color-primary-main)] hover:underline"
                >
                  Create or join one
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border-light)]">
                {cooperatives.slice(0, 5).map((coop: any) => (
                  <li key={coop.id}>
                    <Link
                      to={`/cooperatives/${coop.id}`}
                      className="flex items-center justify-between py-3 hover:bg-[var(--color-secondary-main)] -mx-5 px-5 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[var(--color-primary-light)] rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-[var(--color-primary-main)]" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">
                            {coop.name}
                          </p>
                          <p className="text-sm text-[var(--color-text-secondary)]">
                            {coop.memberCount || 0} members
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Active</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Recent Activity
            </h2>
            <Link
              to="/ledger"
              className="text-sm text-[var(--color-primary-main)] hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody>
            <ul className="space-y-4">
              {[
                {
                  type: 'contribution',
                  description: 'Monthly contribution paid',
                  amount: '₦50,000',
                  time: '2 hours ago',
                  positive: false,
                },
                {
                  type: 'loan',
                  description: 'Loan approved',
                  amount: '₦200,000',
                  time: '1 day ago',
                  positive: true,
                },
                {
                  type: 'groupbuy',
                  description: 'Joined Rice Group Buy',
                  amount: '₦25,000',
                  time: '2 days ago',
                  positive: false,
                },
                {
                  type: 'contribution',
                  description: 'Interest earned',
                  amount: '₦5,000',
                  time: '3 days ago',
                  positive: true,
                },
              ].map((activity, index) => (
                <li key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.positive
                          ? 'bg-[var(--color-success-light)]'
                          : 'bg-[var(--color-error-light)]'
                      }`}
                    >
                      <TrendingUp
                        className={`w-4 h-4 ${
                          activity.positive
                            ? 'text-[var(--color-success-main)]'
                            : 'text-[var(--color-error-main)] rotate-180'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {activity.description}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-semibold ${
                      activity.positive
                        ? 'text-[var(--color-success-main)]'
                        : 'text-[var(--color-error-main)]'
                    }`}
                  >
                    {activity.positive ? '+' : '-'}
                    {activity.amount}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
