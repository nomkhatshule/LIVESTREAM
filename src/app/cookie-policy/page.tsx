
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CookiePolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">
              Cookie Policy
            </CardTitle>
            <p className="text-muted-foreground text-center">
              Last Updated: February 23, 2026
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              This Cookie Policy explains how LIVENET ("we", "us", and "our") uses
              cookies and similar technologies to recognize you when you visit our
              website and use our services. It explains what these technologies are
              and why we use them, as well as your rights to control our use of them.
            </p>

            <h3>What are cookies?</h3>
            <p>
              Cookies are small data files that are placed on your computer or mobile
              device when you visit a website. Cookies are widely used by website
              owners in order to make their websites work, or to work more
              efficiently, as well as to provide reporting information.
            </p>

            <h3>Why do we use cookies?</h3>
            <p>
              We use first-party and third-party cookies for several reasons. Some
              cookies are required for technical reasons in order for our Services
              to operate, and we refer to these as "essential" or "strictly
              necessary" cookies. Other cookies also enable us to track and target
              the interests of our users to enhance the experience on our Online
              Properties.
            </p>

            <h3>Types of Cookies We Use</h3>
            <ul>
              <li>
                <strong>Essential Cookies:</strong> These cookies are strictly
                necessary to provide you with services available through our
                Website and to use some of its features, such as access to secure
                areas.
              </li>
              <li>
                <strong>Performance and Functionality Cookies:</strong> These cookies
                are used to enhance the performance and functionality of our
                Website but are non-essential to their use. However, without these
                cookies, certain functionality (like videos) may become
                unavailable.
              </li>
              <li>
                <strong>Analytics and Customization Cookies:</strong> These cookies
                collect information that is used either in aggregate form to help
                us understand how our Website is being used or how effective our
                marketing campaigns are, or to help us customize our Website for
                you.
              </li>
            </ul>

            <h3>How can I control cookies?</h3>
            <p>
              You have the right to decide whether to accept or reject cookies. You
              can exercise your cookie rights by setting your preferences in the
              Cookie Consent Manager. The Cookie Consent Manager allows you to
              select which categories of cookies you accept or reject. Essential
              cookies cannot be rejected as they are strictly necessary to provide
              you with services.
            </p>
            <p>
              You can also set or amend your web browser controls to accept or
              refuse cookies. If you choose to reject cookies, you may still use
              our website though your access to some functionality and areas of
              our website may be restricted.
            </p>

            <h3>Changes to this Cookie Policy</h3>
            <p>
              We may update this Cookie Policy from time to time in order to
              reflect, for example, changes to the cookies we use or for other
              operational, legal or regulatory reasons. Please therefore
              re-visit this Cookie Policy regularly to stay informed about our
              use of cookies and related technologies.
            </p>

            <h3>Contact Us</h3>
            <p>
              If you have any questions about our use of cookies or other
              technologies, please email us at privacy@livenet.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
