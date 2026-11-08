# Kitoko : de ce dossier à l'App Store et Google Play

Ce dossier contient l'application complète, pour iPhone et Android :

- `app/` : les écrans (Accueil animé, Coiffeuses, Mèches, Mon espace, réservation, panier, avis, espaces pro) ;
- `supabase/` : le serveur (base de données, sécurité, notifications push).

Tout se fait depuis un **PC Windows**. Le Mac n'est pas nécessaire : Expo compile la version iPhone en ligne.

**Budget :**

| Élément | Prix |
|---|---|
| Supabase (serveur) | gratuit au départ |
| Expo / EAS (compilation) | gratuit, avec un nombre de compilations limité par mois |
| Google Play | 25 $ une seule fois |
| Apple Developer | 99 $ par an |

---

## Étape 1 : installer les outils (une seule fois)

1. Installe **Node.js LTS** : https://nodejs.org (garde les options par défaut).
2. Installe **Visual Studio Code** : https://code.visualstudio.com
3. Décompresse `kitoko-app.zip`, par exemple dans `Documents\kitoko-app`.
4. Ouvre ce dossier dans VS Code, puis ouvre le terminal (menu **Terminal > Nouveau terminal**) et tape :

```
npm install
npx expo install --fix
```

La deuxième commande aligne toutes les versions sur celles d'Expo. C'est normal qu'elle modifie `package.json`.

## Étape 2 : créer le serveur Supabase (environ 10 minutes)

1. Crée un compte sur https://supabase.com, puis clique sur **New project**. Nom : `kitoko`. Région : **West EU (Ireland)** ou **Central EU (Frankfurt)**. Note bien le mot de passe de la base.
2. Va dans **SQL Editor > New query**. Colle tout le contenu de `supabase/schema.sql`, puis clique sur **Run**.
3. Fais une nouvelle requête avec le contenu de `supabase/seed.sql`, puis **Run**. Cette étape importe les 27 salons de ton fichier Excel.
4. Va dans **Authentication > Email Templates > Magic Link**. Remplace le texte par celui-ci, pour que l'e-mail contienne un code à 6 chiffres :

   ```
   <h2>Ton code Kitoko</h2>
   <p>Entre ce code dans l'app : <strong>{{ .Token }}</strong></p>
   <p>Il expire dans 1 heure.</p>
   ```

5. Va dans **Project Settings > API**. Copie le **Project URL** et la clé **anon public**.
6. Dans le dossier de l'app, copie le fichier `.env.example` en `.env`, puis colle ces deux valeurs dedans.

> Pour un lancement public, configure un vrai service d'envoi d'e-mails dans **Authentication > SMTP Settings** (par exemple Brevo, qui est gratuit au départ). L'envoi intégré à Supabase est limité à quelques e-mails par heure.

## Étape 3 : tester sur ton téléphone

1. Installe l'app **Expo Go** sur ton téléphone (App Store ou Google Play).
2. Dans le terminal, tape `npx expo start`.
3. Scanne le QR code : avec l'appareil photo sur iPhone, avec Expo Go sur Android.
4. Connecte-toi dans l'app avec ton adresse e-mail.

**Pour devenir administrateur.** Cela te permet de gérer les 27 salons importés et de modérer les avis. Dans Supabase, va dans **SQL Editor** et lance :

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'ngassawilliamm@gmail.com';
```

## Étape 4 : activer les notifications push

Les notifications push ne fonctionnent pas dans Expo Go : il faut une version compilée de l'app (voir l'étape 5). Prépare-les maintenant :

1. Installe l'outil Expo, puis connecte-toi et lie le projet :

   ```
   npm install -g eas-cli
   eas login
   eas init
   ```

   La commande `eas init` remplit automatiquement le `projectId` dans `app.json`.

2. **Android.** Crée un projet gratuit sur https://console.firebase.google.com et ajoute-y une app Android avec le nom de paquet `be.kitoko.app`.
   - Télécharge le fichier `google-services.json`, mets-le à la racine du dossier, et ajoute `"googleServicesFile": "./google-services.json"` dans la partie `android` de `app.json`.
   - Dans Firebase, va dans **Paramètres du projet > Comptes de service** et génère une clé privée.
   - Lance `eas credentials`, puis choisis **Android > Google Service Account > FCM V1** et donne-lui cette clé.
3. **iPhone.** Au premier build iOS, EAS crée la clé de notifications tout seul, avec ton compte Apple Developer.
4. **Brancher le serveur.** Il reste à installer la fonction qui envoie les notifications :

   ```
   npx supabase login
   npx supabase link --project-ref TON_ID_DE_PROJET
   npx supabase secrets set WEBHOOK_SECRET=choisis-une-longue-phrase-secrete
   npx supabase functions deploy notify --no-verify-jwt
   ```

5. Dans Supabase, va dans **Database > Webhooks** et crée **deux webhooks**, un pour la table `bookings` et un pour la table `orders`. Pour chacun :
   - événements : **Insert** et **Update** ;
   - type : **Supabase Edge Functions**, fonction `notify` ;
   - en-tête HTTP : `x-webhook-secret`, avec la même phrase secrète qu'au point 4.

## Étape 5 : compiler l'app

**Version de test pour Android** (un fichier APK à installer directement sur un téléphone) :

```
eas build --platform android --profile preview
```

**Versions pour les stores :**

```
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Étape 6 : publier

1. **Google Play.**
   - Crée ton compte sur https://play.google.com/console (25 $), puis crée l'app « Kitoko ».
   - Lance `eas submit --platform android`.
   - Avant de publier, Google impose un test fermé avec **au moins 12 testeurs pendant 14 jours** pour les nouveaux comptes personnels. Tes coiffeuses partenaires peuvent servir de testeuses.
2. **App Store.**
   - Crée ton compte sur https://developer.apple.com (99 $ par an), puis crée l'app dans App Store Connect.
   - Lance `eas submit --platform ios`. L'app passe ensuite en vérification chez Apple, ce qui prend généralement 1 à 3 jours.
3. Les deux stores demandent :
   - une **politique de confidentialité** en ligne (une URL) ;
   - des captures d'écran ;
   - une description de l'app ;
   - une adresse e-mail de contact.

   La suppression du compte depuis l'app, exigée par Apple, est déjà prévue dans « Mon espace ».

---

## Ce que fait l'app

- **Accueil animé** : tresse animée, mot qui change dans le titre, bandeau défilant, compteurs, salons et boutiques mis en avant.
- **Coiffeuses** : recherche par ville, style et mode, fiche détaillée, avis et contact.
- **Réservation** : la demande arrive dans l'espace de la coiffeuse avec une **notification push**. Elle valide ou refuse, éventuellement avec un message, et la cliente est notifiée. Les rendez-vous des salons importés sont gérés par l'équipe.
- **Avis** : une note de 1 à 5 étoiles, « satisfaite ou pas » et un commentaire. Seulement après un rendez-vous **validé et passé** : c'est contrôlé par le serveur, donc on ne peut pas tricher.
- **Mèches** : les vendeurs et le catalogue (type, couleur, ville). Au panier, on choisit le **mode de paiement** et la **livraison au salon du rendez-vous**. Le fournisseur accepte la commande, la passe en route, livrée, puis payée, et l'acheteur ainsi que le salon sont notifiés.
- **Sécurité** : chacun ne voit que ce qui le concerne. Le numéro de la cliente n'est visible que par son salon, et une commande seulement par l'acheteur, le fournisseur et le salon de livraison.
- **Suppression du compte** depuis l'app.

## Pas encore inclus (prochaines étapes)

- Le **paiement en ligne** par carte ou Bancontact (via Mollie ou Stripe). Pour l'instant, la cliente paie le fournisseur directement.
- Le **blocage automatique des doubles réservations** à partir d'horaires d'ouverture.
- Les **photos** des réalisations des coiffeuses.
- La **version néerlandaise** de l'app.
