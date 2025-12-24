import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, Search, Filter } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { fetchCooperatives } from '@/store/slices/cooperativeSlice';
import { Card, CardBody, Button, Input, Badge, Spinner } from '@/components/common';

const CooperativeListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cooperatives, loading } = useAppSelector((state) => state.cooperative);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchCooperatives());
  }, [dispatch]);

  const filteredCooperatives = cooperatives.filter((coop: any) =>
    coop.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">
            Cooperatives
          </h1>
          <p className="text-[#64748B] mt-1">
            Manage your cooperative memberships
          </p>
        </div>
        <Link to="/cooperatives/new">
          <Button icon={<Plus className="w-5 h-5" />}>Create Cooperative</Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search cooperatives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        <Button variant="outline" icon={<Filter className="w-5 h-5" />}>
          Filters
        </Button>
      </div>

      {/* Cooperatives Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredCooperatives.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-[#94A3B8]" />
            <h3 className="mt-4 text-lg font-medium text-[#0F172A]">
              {searchQuery ? 'No cooperatives found' : 'No cooperatives yet'}
            </h3>
            <p className="mt-2 text-[#64748B]">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating a new cooperative or joining an existing one.'}
            </p>
            {!searchQuery && (
              <Link to="/cooperatives/new" className="mt-4 inline-block">
                <Button>Create your first cooperative</Button>
              </Link>
            )}
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCooperatives.map((coop: any) => (
            <Link key={coop.id} to={`/cooperatives/${coop.id}`}>
              <Card hoverable className="h-full">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#E3F2FD] rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-[#1E88E5]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0F172A]">
                          {coop.name}
                        </h3>
                        <p className="text-sm text-[#64748B]">
                          {coop.memberCount || 0} members
                        </p>
                      </div>
                    </div>
                    <Badge variant={coop.status === 'active' ? 'success' : 'default'}>
                      {coop.status || 'Active'}
                    </Badge>
                  </div>

                  {coop.description && (
                    <p className="mt-4 text-sm text-[#64748B] line-clamp-2">
                      {coop.description}
                    </p>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-sm">
                    <div>
                      <span className="text-[#64748B]">
                        Monthly contribution:
                      </span>
                      <span className="ml-1 font-medium text-[#0F172A]">
                        ₦{(coop.contributionAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[#1E88E5]">View →</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CooperativeListPage;
