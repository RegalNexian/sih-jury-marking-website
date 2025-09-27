import Navbar from '../Navbar';
import Footer from '../Footer';

function PageLayout({ children, hero }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      {hero}
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default PageLayout;
