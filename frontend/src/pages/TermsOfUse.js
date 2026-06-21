import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8">
          <ArrowLeft size={20} /> Retour
        </button>

        <div className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions d'Utilisation</h1>
          <p className="text-gray-500 mb-8">Dernière mise à jour : 20 Juin 2026</p>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
            <p className="text-sm text-blue-800">
              <strong>Propriétaire :</strong> Alpha Omega Digital<br />
              <strong>Contact :</strong> alphaomegadigital35@gmail.com<br />
              <strong>WhatsApp :</strong> +229 01 67 72 80 61
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptation des Conditions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              En accédant et en utilisant le système ERP (ci-après « le Logiciel ») fourni par Alpha Omega Digital (ci-après « le Fournisseur », « nous », « notre »), vous acceptez d'être lié par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le Logiciel.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Le Fournisseur se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés de tout changement substantiel par email ou via le Logiciel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description du Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Logiciel est un système de gestion intégré (ERP) qui comprend les modules suivants :
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Gestion de stock et d'inventaire</li>
              <li>Relation client (CRM)</li>
              <li>Gestion de projets et de tâches</li>
              <li>Facturation et comptabilité</li>
              <li>Gestion des employés et des ressources humaines</li>
              <li>Rapports et tableaux de bord</li>
              <li>Intégrations tierces (Google Calendar, Slack, Microsoft Teams)</li>
              <li>Notifications par email et WhatsApp</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Conditions d'Abonnement</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Logiciel est proposé selon un modèle d'abonnement avec les plans suivants :
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Plan</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Prix</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Utilisateurs</th>
                    <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold">Produits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Free</td><td className="border border-gray-200 px-4 py-3 text-sm">Gratuit</td><td className="border border-gray-200 px-4 py-3 text-sm">1</td><td className="border border-gray-200 px-4 py-3 text-sm">50</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Starter</td><td className="border border-gray-200 px-4 py-3 text-sm">29 €/mois</td><td className="border border-gray-200 px-4 py-3 text-sm">5</td><td className="border border-gray-200 px-4 py-3 text-sm">500</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Professional</td><td className="border border-gray-200 px-4 py-3 text-sm">79 €/mois</td><td className="border border-gray-200 px-4 py-3 text-sm">25</td><td className="border border-gray-200 px-4 py-3 text-sm">Illimité</td></tr>
                  <tr><td className="border border-gray-200 px-4 py-3 text-sm">Enterprise</td><td className="border border-gray-200 px-4 py-3 text-sm">199 €/mois</td><td className="border border-gray-200 px-4 py-3 text-sm">Illimité</td><td className="border border-gray-200 px-4 py-3 text-sm">Illimité</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Les paiements sont dus au début de chaque période de facturation. L'annulation peut être effectuée à tout moment, prenant effet à la fin de la période en cours.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Obligations de l'Utilisateur</h2>
            <p className="text-gray-700 leading-relaxed mb-4">L'utilisateur s'engage à :</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Fournir des informations exactes lors de l'inscription</li>
              <li>Maintenir la confidentialité de ses identifiants de connexion</li>
              <li>Utiliser le Logiciel conformément à sa destination</li>
              <li>Ne pas tenter de contourner les mesures de sécurité</li>
              <li>Ne pas redistribuer, louer ou vendre l'accès au Logiciel</li>
              <li>Respecter les lois et réglementations en vigueur</li>
              <li>Notifier immédiatement tout usage non autorisé de son compte</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Propriété Intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Logiciel et tous ses composants (code source, interfaces, documentation, marques) sont la propriété exclusive d'Alpha Omega Digital. Toute reproduction, modification, distribution ou exploitation non autorisée est strictement interdite.
            </p>
            <p className="text-gray-700 leading-relaxed">
              L'utilisateur conserve la propriété exclusive des données qu'il saisit dans le Logiciel. Alpha Omega Digital n'acquiert aucun droit sur ces données.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Disponibilité du Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Fournisseur s'efforce de garantir une disponibilité de 99,9% du service. Cependant, des interruptions peuvent survenir pour maintenance, mises à jour ou causes de force majeure.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Le Fournisseur ne saurait être tenu responsable des pertes de données résultant d'interruptions de service, de pannes techniques ou de cas de force majeure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation de Responsabilité</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Dans la mesure permise par la loi, Alpha Omega Digital ne sera pas responsable des dommages indirects, perte de données, perte de revenus ou tout autre dommage résultant de l'utilisation du Logiciel.
            </p>
            <p className="text-gray-700 leading-relaxed">
              La responsabilité totale du Fournisseur ne dépassera pas le montant payé par l'utilisateur au cours des 12 derniers mois.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Résiliation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Le Fournisseur se réserve le droit de suspendre ou résilier l'accès de l'utilisateur en cas de violation des présentes conditions, après notification préalable.
            </p>
            <p className="text-gray-700 leading-relaxed">
              À la résiliation, l'utilisateur dispose de 30 jours pour exporter ses données. Passé ce délai, les données seront supprimées définitivement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Droit Applicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Ces conditions sont régies par les lois en vigueur. Tout litige sera soumis aux tribunaux compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Contact</h2>
            <div className="bg-gray-50 p-6 rounded-xl">
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
