import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import TeamNavigation from './TeamNavigation';
import UserNavigation from './UserNavigation';
import { Role } from '@prisma/client';
import { useSession } from 'next-auth/react';

const Navigation = () => {
  const { asPath, isReady, query } = useRouter();
  const [activePathname, setActivePathname] = useState<string | null>(null);
  const { data: session } = useSession();

  const { slug } = query as { slug?: string };

  // Determine active path
  useEffect(() => {
    if (isReady && asPath) {
      const pathname = new URL(asPath, location.href).pathname;
      setActivePathname(pathname);
    }
  }, [asPath, isReady]);

  // Determine role from session
  const role = session?.user?.role || 'STUDENT'; // default to STUDENT if undefined

  return (
    <nav className="flex flex-1 flex-col">
      {slug ? (
        <TeamNavigation activePathname={activePathname} slug={slug} />
      ) : (
        <UserNavigation activePathname={activePathname} role={role} />
      )}
    </nav>
  );
};

export default Navigation;
