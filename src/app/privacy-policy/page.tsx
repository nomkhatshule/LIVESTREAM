
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-3xl font-headline text-center">
              Privacy Policy
            </CardTitle>
            <p className="text-muted-foreground text-center">
              Last Updated: July 26, 2024
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <h2>Introduction</h2>
            <p>
              Welcome to LIVENET. We are committed to protecting your privacy
              and handling your data in an open and transparent manner. This
              Privacy Policy explains how we collect, use, and share your
              information when you use our Services.
            </p>

            <h3>1. Information We Collect</h3>
            <p>We collect information in a few different ways:</p>
            <ul>
              <li>
                <strong>Information you provide us directly:</strong> This includes
                information you provide when you create an account (like your
                username, email, and password), your profile information (like your bio and
                profile picture), and the content you create, such as live
                streams, comments, and messages.
              </li>
              <li>
                <strong>Information we get when you use our services:</strong> We
                collect information about which services you’ve used and how
                you’ve used them. This might include usage information, device
                information, and location information.
              </li>
              <li>
                <strong>Information from third parties:</strong> We may collect
                information from other users, our affiliates, and third-party
                services.
              </li>
            </ul>

            <h3>2. How We Use Your Information</h3>
            <p>
              We use the information we collect to provide, maintain, and
              improve our Services. This includes:
            </p>
            <ul>
              <li>Developing and improving our products and services.</li>
              <li>Communicating with you.</li>
              <li>
                Personalizing the Services, for instance by suggesting content
                you might like.
              </li>
              <li>Enforcing our Terms of Service and other policies.</li>
            </ul>
             <h3>3. AI Features and Data Usage</h3>
            <p>
              To provide our AI-powered features (like the in-stream assistant), we may process certain data, which can include:
            </p>
            <ul>
                <li><strong>Text Prompts:</strong> Your questions to the assistant and inputs for game generation.</li>
                <li><strong>Broadcast Context:</strong> High-level, non-personal data about the stream title and category to provide relevant responses.</li>
                <li><strong>Video Frames:</strong> If you use the "scan frame" feature, a single, temporary image from the stream is sent for analysis. This frame is not stored long-term.</li>
            </ul>
            <p>
              This data is processed by our AI service providers (like Google's Gemini) to generate responses. We do not use your personal conversations or private data to train our AI models.
            </p>

            <h3>4. How We Share Information</h3>
            <p>We may share your information with:</p>
            <ul>
              <li>
                <strong>Other LIVENET users:</strong> Your profile information and
                content you share publicly will be visible to other users.
              </li>
              <li>
                <strong>Our service providers and partners:</strong> We use third
                parties to help us operate and improve our Services.
              </li>
              <li>
                <strong>Legal and safety reasons:</strong> We may share
                information about you if we reasonably believe that disclosing
                the information is needed to comply with any valid legal
                process, governmental request, or applicable law, rule, or
                regulation.
              </li>
            </ul>

            <h3>5. How Long We Keep Your Information</h3>
            <p>
              We store your basic account information—like your name, username,
              and email address—and list of friends until you ask us to delete
              them. We store other information for shorter periods. For
              example, we delete chat messages and stream data after a certain
              period of time.
            </p>

            <h3>6. Your Rights and Choices</h3>
            <p>
              You have the right to access, update, and delete your personal
              information. You can manage your profile information from within
              the app. If you wish to delete your account, you can do so from
              the account settings.
            </p>

            <h3>7. Children's Privacy</h3>
            <p>
              Our Services are not directed to children under the age of 13,
              and we do not knowingly collect personal information from
              children under 13.
            </p>

            <h3>8. Changes to this Policy</h3>
            <p>
              We may change this Privacy Policy from time to time. When we do,
              we’ll let you know one way or another. Sometimes, we’ll let you
              know by revising the date at the top of the policy that’s
              available on our website and mobile application. Other times, we
              may provide you with additional notice (such as adding a
              statement to our websites’ homepages or providing you with an
              in-app notification).
            </p>
             <h3>Contact Us</h3>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at privacy@livenet.com.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
