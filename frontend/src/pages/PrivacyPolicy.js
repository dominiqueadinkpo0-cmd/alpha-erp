import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft size={20} /> Retour
        </button>

        <div className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
          <p className="text-gray-500 mb-8">Dernière mise à jour : 20 Juin 2026</p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>Responsable du traitement :</strong> Alpha Omega Digital<br />
              <strong>Contact :</strong> alphaomegadigital35@gmail.com<br />
              <strong>WhatsApp :</strong> +229 01 67 72 80 61
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Alpha Omega Digital (ci-après « nous », « notre ») s'engage à protéger la vie privée des utilisateurs de son système ERP (ci-après « le Logiciel »). Cette Politique de Confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations personnelles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Données Collectées</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Nous collectons les types de données suivants :</p>
            
            <h3 className="text-lg font-medium text-gray-900 mb-3">2.1 Données d'identification</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Adresse postale</li>
              <li>Nom de l'entreprise</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-3">2.2 Données d'utilisation</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Historique des connexions (dates, heures, adresses IP)</li>
              <li>Actions effectuées dans le Logiciel</li>
              <li>Préférences et paramètres</li>
              <li>Données de performance et d'erreurs</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mb-3">2.3 Données métier saisies</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Informations sur les produits et l'inventaire</li>
              <li>Données clients et fournisseurs</li>
              <li>Factures et transactions financières</li>
              <li>Informations sur les projets et employés</li>
              <li>Messages du chatbot</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Utilisation des Données</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fournir et maintenir le service ERP</li>
              <li>Personnaliser votre expérience utilisateur</li>
              <li>Envoyer des notifications et alertes (email, WhatsApp)</li>
              <li>Améliorer le Logiciel et développer de nouvelles fonctionnalités</li>
              <li>Assurer la sécurité et prévenir la fraude</li>
              <li>Respecter nos obligations légales</li>
              <li>Vous contacter pour le support client</li>
              <li>Générer des statistiques agrégées (anonymisées)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Partage des Données</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous ne vendons jamais vos données personnelles. Vos données peuvent être partagées uniquement avec :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Intégrations tierces que vous activez :</strong> Google Calendar, Slack, Microsoft Teams — ces services reçoivent uniquement les données nécessaires au fonctionnement de l'intégration</li>
              <li><strong>Prestataires de services :</strong> Hébergeur de base de données, service d'envoi d'emails (SMTP), service WhatsApp (Twilio) — sous contrat de confidentialité strict</li>
              <li><strong>Autorités compétentes :</strong> En cas d'obligation légale ou de réquisition judiciaire</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Sécurité des Données</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Chiffrement des mots de passe (bcrypt)</li>
              <li>Authentification par token JWT avec expiration</li>
              <li>Contrôle d'accès basé sur les rôles (RBAC)</li>
              <li>Sauvegardes régulières de la base de données</li>
              <li>Journalisation des actions sensibles</li>
              <li>Protection contre les attaques XSS, CSRF et SQL injection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Conservation des Données</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Type de donnée</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Durée de conservation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Données de compte</td><td className="border border-gray-200 px-4 py-3 text-sm">Durée de l'abonnement + 30 jours</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Données métier</td><td className="border border-gray-200 px-4 py-3 text-sm">Durée de l'abonnement + 30 jours</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Logs d'activité</td><td className="border border-gray-200 px-4 py-3 text-sm">12 mois</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Données de facturation</td><td className="border border-gray-200 px-4 py-3 text-sm">5 ans (obligation légale)</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Messages chatbot</td><td className="border border-gray-200 px-4 py-3 text-sm">6 mois</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Vos Droits</h2>
            <p className="text-gray-700 leading-relaxed mb-4">Conformément aux réglementations en vigueur, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> Corriger des données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
              <li><strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
              <li><strong>Droit de limitation :</strong> Demander la limitation du traitement</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à : <strong>alphaomegadigital35@gmail.com</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies et Technologies Similaires</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Logiciel utilise des cookies strictement nécessaires au fonctionnement :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Cookie d'authentification :</strong> Maintient votre session active</li>
              <li><strong>Cookie de préférence :</strong> Stocke vos paramètres (langue, thème)</li>
              <li><strong>Cookie de sécurité :</strong> Protège contre les attaques CSRF</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Nous n'utilisons pas de cookies publicitaires ni de trackers tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Services Tiers</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Si vous activez des intégrations tierces, leurs propres politiques de confidentialité s'appliquent :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li><strong>Google Calendar :</strong> <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité Google</a></li>
              <li><strong>Slack :</strong> <a href="https://slack.com/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité Slack</a></li>
              <li><strong>Microsoft Teams :</strong> <a href="https://privacy.microsoft.com/privacystatement" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité Microsoft</a></li>
              <li><strong>Twilio (WhatsApp) :</strong> <a href="https://www.twilio.com/legal/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Politique de confidentialité Twilio</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Transferts de Données</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données sont hébergées dans l'Union Européenne. Tout transfert vers des pays tiers ne sera effectué qu'avec des garanties adéquates (clauses contractuelles types, décision d'adéquation, etc.).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Modifications</h2>
            <p className="text-gray-700 leading-relaxed">
              Cette politique peut être mise à jour périodiquement. Nous vous notifierons tout changement significatif par email ou via le Logiciel au moins 30 jours avant son entrée en vigueur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact</h2>
            <div className="bg-gray-50 p-6 rounded-xl">
              <p className="text-gray-700 mb-2"><strong>Pour toute question concernant cette politique :</strong></p>
              <p className="text-gray-700"><strong>Alpha Omega Digital</strong></p>
              <p className="text-gray-700">Email : alphaomegadigital35@gmail.com</p>
              <p className="text-gray-700">WhatsApp : +229 01 67 72 80 61</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
