--
-- PostgreSQL database dump
--

\restrict trKLNtSPe0JYec5P2IR1NCYWUbne5U1VV3Pbzuw2TwsWSQnVT5HhfJqSyp8oGeg

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-2.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
00000000-0000-0000-0000-000000000000	f025085f-f190-494f-bd3d-4c57f8a4dcd5	{"action":"user_signedup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-09-20 03:47:29.121805+00	
00000000-0000-0000-0000-000000000000	fb79419d-6459-433b-b240-0332785e08fd	{"action":"login","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-20 03:47:29.140019+00	
00000000-0000-0000-0000-000000000000	2638910c-3b03-475f-83f6-eff5021c5650	{"action":"login","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-20 03:47:34.77223+00	
00000000-0000-0000-0000-000000000000	09653453-1a4e-4100-ae6d-af3d2565dbb8	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:56:38.751681+00	
00000000-0000-0000-0000-000000000000	35968162-f3e2-4768-9fef-d9884bcce6c4	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:14.642381+00	
00000000-0000-0000-0000-000000000000	b3278bb9-5e5a-488a-9b31-44e69ae73667	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:15.445419+00	
00000000-0000-0000-0000-000000000000	33668a15-9c0e-4509-8d4e-03d7b329bbf7	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:26.148973+00	
00000000-0000-0000-0000-000000000000	0d7eee96-edbb-4424-84d2-9e483e53fa2c	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:26.820044+00	
00000000-0000-0000-0000-000000000000	eace8cf8-4a74-4967-a7db-bc6b25676e9c	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:27.126003+00	
00000000-0000-0000-0000-000000000000	c691bed8-3d24-4a15-8487-1161f5d3e1a0	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:27.365914+00	
00000000-0000-0000-0000-000000000000	456456ca-bc4b-43bb-a538-af6776b8722c	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:57:50.559582+00	
00000000-0000-0000-0000-000000000000	f91a63f3-a3e6-4c04-bbb4-adbf3b179839	{"action":"user_repeated_signup","actor_id":"54a70c78-5150-431d-9ac0-6392c74578ba","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}	2025-09-29 04:59:48.602154+00	
00000000-0000-0000-0000-000000000000	6c2c9333-42b3-47bb-abe0-92ac6ed12fc7	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"murad.novruzov1899@gmail.com","user_id":"54a70c78-5150-431d-9ac0-6392c74578ba","user_phone":""}}	2025-09-29 05:02:53.627834+00	
00000000-0000-0000-0000-000000000000	25c05c8b-9496-46c6-8106-30b57eb0eca3	{"action":"user_signedup","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}	2025-09-29 05:03:08.457257+00	
00000000-0000-0000-0000-000000000000	9594af42-707a-4356-ace9-3055bf682a5c	{"action":"login","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-29 05:03:08.463997+00	
00000000-0000-0000-0000-000000000000	dc42e74f-f1aa-45a1-8ad2-32e17e287457	{"action":"login","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-29 05:03:11.788357+00	
00000000-0000-0000-0000-000000000000	50e5cafe-189f-4d38-a693-054bb1bfef8b	{"action":"login","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-29 05:21:04.332034+00	
00000000-0000-0000-0000-000000000000	37d1d77d-40c3-4fba-8566-16c9c7903b99	{"action":"login","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-29 05:40:16.233034+00	
00000000-0000-0000-0000-000000000000	c8cc9581-d7e4-41ce-aaa2-6c794330e6e3	{"action":"token_refreshed","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-09-29 17:13:52.045746+00	
00000000-0000-0000-0000-000000000000	f48a876c-7053-4610-8784-70f19a22873d	{"action":"token_revoked","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-09-29 17:13:52.055544+00	
00000000-0000-0000-0000-000000000000	ecdb4798-0a2b-45df-b93f-0255c39ae334	{"action":"login","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}	2025-09-29 17:15:21.578675+00	
00000000-0000-0000-0000-000000000000	7726411d-e983-4067-92bb-8d1094fc48a2	{"action":"token_refreshed","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-09-29 20:37:47.425902+00	
00000000-0000-0000-0000-000000000000	84927346-0f19-4951-84c2-631b326909e9	{"action":"token_revoked","actor_id":"391ef318-e31b-4731-bf38-fd7ee0e9290b","actor_username":"murad.novruzov1899@gmail.com","actor_via_sso":false,"log_type":"token"}	2025-09-29 20:37:47.452692+00	
00000000-0000-0000-0000-000000000000	e75eb860-d77f-4ba0-9e68-b1cf3b2d044f	{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"muradnovruzov@proton.me","user_id":"820a1379-20f7-4bc1-8c52-96a44f4eca5d","user_phone":""}}	2025-10-05 02:35:41.438683+00	
00000000-0000-0000-0000-000000000000	2db944d8-3354-4c72-8f06-6591c1b9873f	{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"muradnovruzov@proton.me","user_id":"820a1379-20f7-4bc1-8c52-96a44f4eca5d","user_phone":""}}	2025-10-05 02:46:25.757883+00	
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
00000000-0000-0000-0000-000000000000	391ef318-e31b-4731-bf38-fd7ee0e9290b	authenticated	authenticated	murad.novruzov1899@gmail.com	$2a$10$HdITOJVeF6l9qP05V6pVleV/75vtHvz1LNC7xKxUnQDgucoVxoEfK	2025-09-29 05:03:08.457825+00	\N		\N		\N			\N	2025-09-29 17:15:21.600841+00	{"provider": "email", "providers": ["email"]}	{"sub": "391ef318-e31b-4731-bf38-fd7ee0e9290b", "email": "murad.novruzov1899@gmail.com", "email_verified": true, "phone_verified": false}	\N	2025-09-29 05:03:08.428516+00	2025-09-29 20:37:47.493677+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
391ef318-e31b-4731-bf38-fd7ee0e9290b	391ef318-e31b-4731-bf38-fd7ee0e9290b	{"sub": "391ef318-e31b-4731-bf38-fd7ee0e9290b", "email": "murad.novruzov1899@gmail.com", "email_verified": false, "phone_verified": false}	email	2025-09-29 05:03:08.449024+00	2025-09-29 05:03:08.449076+00	2025-09-29 05:03:08.449076+00	c5dcef88-b2dc-40d1-9c7b-4a512c27af57
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
cd6eca4d-232b-48de-b4a4-fc4e396c217a	391ef318-e31b-4731-bf38-fd7ee0e9290b	2025-09-29 05:03:08.468935+00	2025-09-29 05:03:08.468935+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	67.68.103.34	\N
5ec7eaa6-c611-43a6-9c4e-d84ae416ad4c	391ef318-e31b-4731-bf38-fd7ee0e9290b	2025-09-29 05:03:11.793645+00	2025-09-29 05:03:11.793645+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	67.68.103.34	\N
ebf0c5d9-838d-496c-885f-a24fd8180c89	391ef318-e31b-4731-bf38-fd7ee0e9290b	2025-09-29 05:21:04.337363+00	2025-09-29 05:21:04.337363+00	\N	aal1	\N	\N	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	67.68.103.34	\N
8e7d11a1-4773-48fd-9f8e-ba7d08e2d242	391ef318-e31b-4731-bf38-fd7ee0e9290b	2025-09-29 05:40:16.272339+00	2025-09-29 17:13:52.077845+00	\N	aal1	\N	2025-09-29 17:13:52.076488	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	67.68.103.34	\N
c7338c92-f038-4a69-8ba9-c788b5dfa58d	391ef318-e31b-4731-bf38-fd7ee0e9290b	2025-09-29 17:15:21.601624+00	2025-09-29 20:37:47.500323+00	\N	aal1	\N	2025-09-29 20:37:47.500237	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	67.68.103.34	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
cd6eca4d-232b-48de-b4a4-fc4e396c217a	2025-09-29 05:03:08.489779+00	2025-09-29 05:03:08.489779+00	password	94fa77d0-f4ba-44fe-b441-96f9968cd966
5ec7eaa6-c611-43a6-9c4e-d84ae416ad4c	2025-09-29 05:03:11.80058+00	2025-09-29 05:03:11.80058+00	password	858af10f-2f67-4eff-ad08-6a1b95b0d333
ebf0c5d9-838d-496c-885f-a24fd8180c89	2025-09-29 05:21:04.351532+00	2025-09-29 05:21:04.351532+00	password	18d0c4af-3958-4d7a-b7c6-1f98afa66688
8e7d11a1-4773-48fd-9f8e-ba7d08e2d242	2025-09-29 05:40:16.323018+00	2025-09-29 05:40:16.323018+00	password	93467945-49e8-409e-87c4-09c288da53ed
c7338c92-f038-4a69-8ba9-c788b5dfa58d	2025-09-29 17:15:21.66086+00	2025-09-29 17:15:21.66086+00	password	d4fdf525-3ac4-4673-bc39-9e33ee5edfc2
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
00000000-0000-0000-0000-000000000000	3	urtqy7wecdoj	391ef318-e31b-4731-bf38-fd7ee0e9290b	f	2025-09-29 05:03:08.475499+00	2025-09-29 05:03:08.475499+00	\N	cd6eca4d-232b-48de-b4a4-fc4e396c217a
00000000-0000-0000-0000-000000000000	4	nag6nciq32ni	391ef318-e31b-4731-bf38-fd7ee0e9290b	f	2025-09-29 05:03:11.796326+00	2025-09-29 05:03:11.796326+00	\N	5ec7eaa6-c611-43a6-9c4e-d84ae416ad4c
00000000-0000-0000-0000-000000000000	5	l2rs4vmrneyj	391ef318-e31b-4731-bf38-fd7ee0e9290b	f	2025-09-29 05:21:04.339096+00	2025-09-29 05:21:04.339096+00	\N	ebf0c5d9-838d-496c-885f-a24fd8180c89
00000000-0000-0000-0000-000000000000	6	rhtskprpraeq	391ef318-e31b-4731-bf38-fd7ee0e9290b	t	2025-09-29 05:40:16.285843+00	2025-09-29 17:13:52.056778+00	\N	8e7d11a1-4773-48fd-9f8e-ba7d08e2d242
00000000-0000-0000-0000-000000000000	7	6mvmko7e42np	391ef318-e31b-4731-bf38-fd7ee0e9290b	f	2025-09-29 17:13:52.064409+00	2025-09-29 17:13:52.064409+00	rhtskprpraeq	8e7d11a1-4773-48fd-9f8e-ba7d08e2d242
00000000-0000-0000-0000-000000000000	8	hssdscwuy3qb	391ef318-e31b-4731-bf38-fd7ee0e9290b	t	2025-09-29 17:15:21.621696+00	2025-09-29 20:37:47.455712+00	\N	c7338c92-f038-4a69-8ba9-c788b5dfa58d
00000000-0000-0000-0000-000000000000	9	7cwzvddfvmcv	391ef318-e31b-4731-bf38-fd7ee0e9290b	f	2025-09-29 20:37:47.480837+00	2025-09-29 20:37:47.480837+00	hssdscwuy3qb	c7338c92-f038-4a69-8ba9-c788b5dfa58d
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: app_admins; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_admins (user_id) FROM stdin;
391ef318-e31b-4731-bf38-fd7ee0e9290b
\.


--
-- Data for Name: competencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competencies (id, name, difficulty, tags, test_question, created_at) FROM stdin;
a20e957c-9489-4182-9e25-0691ebbecc08	Understand the resolution of IVUS images compared to OCT and angiography	Beginner	{#IVUS,#Physics,#OCT}	\N	2025-09-29 04:32:13.896654+00
16eff5d1-2d13-46b1-a549-b0ce405aade3	Know how an IVUS image is generated	Beginner	{#IVUS,#Physics}	\N	2025-09-29 04:32:13.896654+00
27cdc049-dee4-4ff9-a8a0-542dd783c17e	Know the relative contraindications to performing IVUS	Beginner	{#IVUS,#Procedure,"#Patient Selection",#Contraindications}	\N	2025-09-29 04:32:13.896654+00
e7793779-84a9-4da8-b50d-d98ef6c0a7bc	Know the steps for performing IVUS	Beginner	{#IVUS,#Procedure}	\N	2025-09-29 04:32:13.896654+00
01d3538b-2073-4012-a9f1-1b9589285a34	Know the anticoagulation protocols necessary to perform IVUS	Beginner	{#IVUS,#Procedure,#Medication,#Pharmacology,#Anticoagulation}	\N	2025-09-29 04:32:13.896654+00
7a69ad0c-0316-49f9-a931-2ebc53bccd93	Know that intracoronary nitroglycerin is recommended prior to IVUS	Beginner	{#IVUS,#Procedure,#Medication,#Pharmacology,#Vasodilator}	\N	2025-09-29 04:32:13.896654+00
9394d223-703c-4362-8c69-a69ff689cded	Know how and with what to purge the rotational IVUS catheter and how to handle the purge syringe	Beginner	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
7569a66e-2718-4d5c-9c7f-ba8eb2b9a14f	Know how to set up the mechanical pullback sleeve	Beginner	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
8d07fc50-03f8-445e-8567-ffce724ea4be	Know how to connect the IVUS catheter correctly	Beginner	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
e895a98c-8c28-43d7-9948-9b6eeaffe5f9	Know how to test the IVUS catheter prior to insertion	Beginner	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
7abff191-d361-4e74-880a-f433191a7193	Be able to identify and know the distances between the catheter markers on angiography for different IVUS catheters	Beginner	{#IVUS,#Procedure,#Equipment,#Measurement}	\N	2025-09-29 04:32:13.896654+00
fb1c1c55-da91-4308-8870-887e69771e2d	Know that flushing, insertion of catheter and purging should be done in "Stand By" mode	Beginner	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
c6719957-0ce6-488f-9727-08e22389054f	Recognize the appearance and consequences of blood within the rotational IVUS catheter	Beginner	{#IVUS,#Procedure,#Equipment,"#Image Interpretation",#Artifact,#Troubleshooting}	\N	2025-09-29 04:32:13.896654+00
2915bb56-adea-4255-aeb5-d9486c6eaf07	Know how to purge the catheter in vivo and recognize the appearance of an appropriately purged rotational IVUS catheter	Beginner	{#IVUS,#Procedure,#Equipment,"#Image Interpretation",#Artifact,#Troubleshooting}	\N	2025-09-29 04:32:13.896654+00
36083f14-0647-4123-85c0-0f8f23af843b	Recognize the appearance when incomplete blood clearance is occuring.	Beginner	{#IVUS,#Procedure,"#Image Interpretation",#Artifact}	\N	2025-09-29 04:32:13.896654+00
13ff862b-7153-4542-b3f3-291bae907eab	Know how to eject the IVUS catheter from the sled	Beginner	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
6495b053-193b-4272-a660-5ce74f4f3fb2	Be able to recognize edge dissection post-PCI on IVUS	Beginner	{#IVUS,"#Image Interpretation","#PCI optimization",#Stent,#Dissection}	\N	2025-09-29 04:32:13.896654+00
fcfdc974-79d6-4898-b9cb-132eb969b2ed	Be able to recognize malapposition post-PCI on IVUS	Beginner	{#IVUS,"#Image Interpretation","#PCI optimization",#Stent,#Malapposition}	\N	2025-09-29 04:32:13.896654+00
b07a1f66-e266-436c-9eb5-83d597502924	Be able to recognize significant tissue protrusion within stent post-PCI on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Stent,"#Tissue Protrusion"}	\N	2025-09-29 04:32:13.896654+00
4d26d281-0f36-4ee0-86f1-783378273709	Know the US guidelines Class of Recommendation and Level of Evidence for IVUS use in left main PCI	Beginner	{#IVUS,"#Patient Selection",#Guidelines,"#Left Main",#Outcomes,"#PCI optimization"}	\N	2025-09-29 04:32:13.896654+00
aa6be855-7700-42db-a75c-7abd7c486433	Know the ESC guidelines Class of Recommendation and Level of Evidence for IVUS use in PCI	Beginner	{#IVUS,"#Patient Selection",#Guidelines,"#PCI optimization"}	\N	2025-09-29 04:32:13.896654+00
d8b2fcdc-de78-4b34-a3b9-9e641cfd14d0	Recognize appearance of a normal coronary artery on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Normal}	\N	2025-09-29 04:32:13.896654+00
84a97cc3-dd5c-4842-81dc-551ce5656620	Recognize the appearance of wire artifact on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Artifact}	\N	2025-09-29 04:32:13.896654+00
5c1ce9a9-289d-49b3-b8bb-fc1532dfc46e	Be able to identify the normal layers of a coronary artery - intima, media and adventitia on a coronary artery on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Normal}	\N	2025-09-29 04:32:13.896654+00
0f73e82d-20bb-4eef-9d60-bf7664d960bb	Know how to recognize fibrous plaque on coronary IVUS	Beginner	{#IVUS,"#Image Interpretation",#Plaque}	\N	2025-09-29 04:32:13.896654+00
0dcdf39f-ddd2-4e34-b321-c6f8a3d5eafa	Know how to recognize lipid plaque on coronary IVUS	Beginner	{#IVUS,"#Image Interpretation",#Plaque}	\N	2025-09-29 04:32:13.896654+00
2a3b372a-baac-4076-a70f-9f2a22e90bb5	Know how to recognize calcium on coronary IVUS	Beginner	{#IVUS,"#Image Interpretation",#Plaque,#Calcium}	\N	2025-09-29 04:32:13.896654+00
bb48e5de-d69f-4cf9-9c7e-a18735160c3e	Be able to recognize thrombus on coronary IVUS	Beginner	{#IVUS,"#Image Interpretation",#Thrombus}	\N	2025-09-29 04:32:13.896654+00
98e2817e-dd8c-4e90-b0d5-1758d9e79051	Understand the differential of high attenuation structures on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Physics}	\N	2025-09-29 04:32:13.896654+00
610c63f9-3255-4257-8b9b-571f0e67a485	Understand the differential of low attenuation structures on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Physics}	\N	2025-09-29 04:32:13.896654+00
140eb728-e1f3-4c2a-a459-6545e182741a	Know the effect and appearance of blood in the lumen with high frequency IVUS	Beginner	{#IVUS,"#Image Interpretation",#Normal,"#High Frequency"}	\N	2025-09-29 04:32:13.896654+00
220c6403-f33a-48b7-972b-8a53d1b4545f	Know how calcium is quantified with IVUS	Beginner	{#IVUS,"#Image Interpretation",#Plaque,#Calcium,#Measurement}	\N	2025-09-29 04:32:13.896654+00
5bfb8c48-a521-44b4-bab8-f736b7561916	Know the quoted penetration depth of IVUS vs OCT imaging	Beginner	{#IVUS,"#Image Interpretation",#Measurement,#Physics}	\N	2025-09-29 04:32:13.896654+00
0d0b605d-569a-45ee-b92e-af2f5a79b97d	Know how to recognize plaque rupture on IVUS	Beginner	{#IVUS,"#Image Interpretation",#Plaque}	\N	2025-09-29 04:32:13.896654+00
f719ff55-0da8-419b-a6d7-8bf1745c0d27	Know safety profile of OCT vs IVUS vs angiography	Beginner	{#IVUS,#Complications,#Angiography,#OCT}	\N	2025-09-29 04:32:13.896654+00
c7436d0b-bffe-4c76-8813-e5861e362239	Know limitations of angiography for determining stent sizing compared to IVUS protocols	Beginner	{#IVUS,"#Image Interpretation",#Measurement,#Angiography}	\N	2025-09-29 04:32:13.896654+00
8aa56475-5545-447e-af7d-85cca934842a	Be familiar with the checklist of material and equipment required to perform IVUS	Intermediate	{#IVUS,#Procedure,#Equipment}	\N	2025-09-29 04:32:13.896654+00
3de61ed6-8182-4574-99ac-ac9150909c33	Know how to use automated vs manual pullback	Intermediate	{#IVUS,#Procedure,#Equipment,#Pullback}	\N	2025-09-29 04:32:13.896654+00
7f3a65e8-73a2-46dd-aa7e-bff9d2078e9e	Be familiar with the construction and parts of the catheter tip	Intermediate	{#IVUS,#Equipment}	\N	2025-09-29 04:32:13.896654+00
6090508f-0714-4681-b8cc-fec938bddbab	Know the available standard pullback lengths for rotational IVUS	Intermediate	{#IVUS,#Procedure,#Measurement,#Equipment,#Rotational,#Pullback}	\N	2025-09-29 04:32:13.896654+00
fdabd6f4-b682-45e6-9403-0a9a250642f0	Understand how long pullback recordings can be performed for.	Intermediate	{#IVUS,#Procedure,#Measurement,#Rotational,#Pullback}	\N	2025-09-29 04:32:13.896654+00
63386678-a278-46cd-948d-36841eea4445	Understand the features that go into strategizing optimal stength length pre-PCI	Intermediate	{#IVUS,"#PCI Optimization",#Pre-PCI,#Measurement,"#Stent Length","#Image Interpretation"}	\N	2025-09-29 04:32:13.896654+00
c4b42b93-d584-4e35-9ad5-4b6971c966c4	Know how the optimal pre-PCI planning stent diameter is determined based off both distal and proximal landing zones	Intermediate	{#IVUS,"#PCI Optimization",#Pre-PCI,#Measurement,"#Stent Diameter","#Image Interpretation"}	\N	2025-09-29 04:32:13.896654+00
22718aee-4fcf-4e6f-b108-d11a223f15e8	Understand the different stent diameter determination methods and the gradient of aggression	Intermediate	{#IVUS,"#PCI Optimization",#Pre-PCI,#Measurement,"#Stent Diameter","#Image Interpretation"}	\N	2025-09-29 04:32:13.896654+00
7b3a7316-c31a-4efd-a3ef-a8ee9b8e35df	Know how to choose post-dilation balloon diameters from pre-PCI IVUS planning	Intermediate	{#IVUS,"#PCI Optimization",#Pre-PCI,#Measurement,"#Image Interpretation"}	\N	2025-09-29 04:32:13.896654+00
8ca7ebc2-45c5-4079-94bd-ca170a63e1c2	Understand the features of post-PCI edge dissection which would indicate additional stenting	Intermediate	{#IVUS,"#PCI Optimization",#Dissection,#Measurement,"#Image Interpretation"}	\N	2025-09-29 04:32:13.896654+00
d16291df-6796-4e06-ae62-1df7d587e72a	Understand the features of post-PCI malapposition which would indicate additional PTCA	Intermediate	{#IVUS,"#PCI Optimization",#Malapposition,"#Image Interpretation"}	\N	2025-09-29 04:32:13.896654+00
0a05ec50-af01-4062-93b4-5c9a7f2ad537	Be able to calculate degree of stent expansion from IVUS  interrogation	Intermediate	{#IVUS,"#PCI Optimization","#Stent Expansion",#Measurement,"#Image Interpretation","#Post PCI"}	\N	2025-09-29 04:32:13.896654+00
d6f08dd7-d457-476b-91dc-00b828f20017	Understand the thresholds of acceptable and optimal stent expansion for post-PCI optimization	Intermediate	{#IVUS,"#PCI Optimization","#Stent Expansion",#Measurement,"#Image Interpretation","#Post PCI"}	\N	2025-09-29 04:32:13.896654+00
a3bdef95-d47f-4eea-8165-76cb377709ed	Understand the MSA and % MSA in relation to reference lumen area which serve as defininig optimal post-PCI result for IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
77e8b78c-6103-41bc-8c99-37f97b14e193	Know the 2018 EAPCI Expert Consensus Summary of Intracoronary Imaging Post PCI optimization targets for IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
b8b7bb60-e13b-480e-8d8b-9162b48b4089	Know the primary trial design and findings of the 2016 ILUMIEN III PCI study.	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
74dbf6c6-124c-4ff7-90c2-94505871c51f	Know the primary trial design and findings of the 2023 ILUMIEN IV PCI study	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
e09e7291-aa12-4872-b099-844c3a78d94b	Know the primary trial design and findings of the 2023 RENOVATE-COMPLEX-PCI study	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
3f266b1d-cfaa-4403-9eb0-c51c76c5573f	Know the primary trial design and findings of the 2023 OCTOBER study	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
1785cd12-8205-4db1-83b9-366f2e9e2d39	Understand the primary OCT finding predictors of 2-year outcomes from ILUMIEN IV study	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
b36e1a4f-a573-4466-9579-d33770668419	Understand the primary comparison performance findings from network meta-analyses of IVUS vs. OCT vs. Angiography-guided PCI	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
6b68cd8a-0262-47b8-80d3-cddb319024bf	Know the new ESC recommendation for use of OCT in ACS patients with no clear culprit lesion and MINOCA	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
30243381-b908-48ba-83d4-6080cf46461a	Know how to recognize Thin Capped Fibroatheroma (TCFA) on IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
2164073c-44ca-41eb-9db8-7c696726ee6c	Understand the calcium findings on IVUS which would indicate use of atherectomy or IVL for lesion preparation	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
ce7dcb03-956b-4bca-903d-2898aaaf6e1a	Know how to categorize the mechanism of restenosis using OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
183e6444-20e7-4b2c-ba85-4746f9230617	Know how to recognize the mechanism of stent thrombosis using IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
16414d6f-655c-4319-ad31-6f55f5fcad1c	Know how to recognize SCAD on coronary IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
e3bdb3d8-5932-4026-aa8d-f8be71f15dbb	Know how to recognize calcium nodules on coronary IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
969fb231-0ebd-434d-8e10-43bcc2100d11	Be able to recognize eruptive calcium nodules on coronary OCT and understand the implications	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
6f295c40-b3cc-480e-ab3f-e9ea35d7b6e5	Know how to differentiate superficial vs deep calcium on coronary OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
0052256d-1180-4924-8016-0b605acd9645	Be able to recognize appropriately modified and fractured calcium regions post atherectomy or lithotripsy on coronary OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
a5739c88-4490-487d-b983-751d9bd13f7a	Be able to calculate OCT-based Calcium Score	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
b90237e6-7ab9-40f9-953a-41e42558887d	Know how to recognize and measure predictors of side branch complications with OCT.	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
452713e6-dbc7-4cbd-a0b8-0a8da37d1123	Know how to recognize intramural hemoatoma on coronary OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
e6803445-6759-4980-a8cc-f4d447f1eed7	Be familiar with layout and use of Aptivue user interface	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
28b5643f-d094-4cd0-98bf-e91de5c7fa63	Be familiar with layout and use of Ultreon version 1 user interface	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
1be3dcf1-c2f8-4e90-b2c8-de4c4a01b7c1	Be familiar with layout and use of Ultreon version 2 user interface	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
370d4153-474c-4c0a-ae33-03d56516deb3	Know the differences between the tapered and dual method in determining proximal vs distal reference in OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
4989650a-acc8-4e70-858b-058b24dd206e	Know the ILUMIEN III and ILUMIEN IV stent optimization protocol	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
37a2a5c2-63e6-4231-9290-e2b67e34fd6c	Recognize the artifact and cause of non-uniform rotational distorsion	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
96f710d3-5f00-4515-a859-9799fe8ef311	Recognize the artifact and cause of saturation artifact	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
ddc2d5c8-bf6e-4089-89f9-ddd4133cfe8b	Recognize the artifact and cause of seam line artifact	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
abf29259-628f-4547-93b6-895fbceea3b6	Recognize the artifact and cause of shadowing artifact	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
7bf8d83f-8bdb-45bb-9824-8a377913793e	Recognize the artifact and cause of tangential signal dropout	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
6da85490-9562-45b3-b144-8e3db9bd584c	Be aware of how often the use of IVUS results in a change in decision making when compared to angiography guidance	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
fec23249-0e6c-4984-b1ae-eaf4d14a6803	Understand how often angiography fails to detect significant calcification compared to IVUS	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
b580c85f-aebe-4131-9e31-157b09a36903	Be familiar with AI detection indicators of significant calcification	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
f40fec93-4e3d-41ad-9d53-5daea74317a5	Understand suggested algorithm for rounding up or rounding down stent diameter depending on OCT measurement of EEL vs. lumen diameter	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
462214a0-4ad2-4c85-855f-eec226eb36ec	Understand suggested algorithm for rounding up or rounding down post-dilatation balloon diameter depending on OCT measurement of EEL vs. lumen diameter	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
d2d388b0-f1b4-44c0-8cec-28fef37d1d4a	Know the direction and % quantitative difference between IVUS and OCT compared in phantom measurements	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
2e1ef8da-730c-4039-8121-864fd22f3c47	Understand the primary OCT finding predictors of 2-year outcomes from OCCUPI study	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
ae4cf3eb-4d42-448e-96c5-31dc55368f27	Recognize the presence and cause of post-PCI stent deformation on OCT imaging	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
7c5d4078-042c-47f8-83e1-c14e4dd8e5f3	Know the incidence of unintended stent deformation detected by OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
023bee57-f432-44ad-a6b4-7b84140799af	Understand the clinical consequences of uncorrected unintended stent defomration detected by OCT	Intermediate	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
5a27cd45-4bd1-48f9-a9ca-bdd8e053338a	Know the EBC and JBC bifurcation club expert consensus use of OCT in coronary bifurcation	Expert	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
30ed6fe4-cff2-48ef-b14e-ce357bead0a8	Know the expected findings and utilization of OCT imaging in patients with bioresorbable scaffolds	Expert	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
300f2037-9dee-4a01-aa4f-583aaaf68259	Know how to use OCT 3D reconstruction in choosing the appropriate cell to cross for optimal bifurcation outcome	Expert	{#IVUS}	\N	2025-09-29 04:32:13.896654+00
c60fbc05-84cc-45f5-941f-dd9f269b9b12	Know the medium which is used to generate IVUS images	Beginner	{#IVUS,#Physics}	\N	2025-09-29 04:32:13.896654+00
8512cd80-0452-4961-ad3e-af2c9b2321b6	Know the clinical indications to perform IVUS	Beginner	{#IVUS,#Procedure,"#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
700316df-f0f6-4ba7-a93f-7afc921d579c	Know the contraindications for performing IVUS	Beginner	{#IVUS,#Procedure,"#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
1612ec56-dde3-4d3a-968c-ab4a50d7a5dc	Know the general steps to perform IVUS	Beginner	{#IVUS,#Procedure}	\N	2025-09-30 06:17:42.494569+00
957b03c2-45b7-4066-a9db-b7a1a468420f	Know the recognized complications associated with IVUS	Beginner	{#IVUS,#Procedure}	\N	2025-09-30 06:17:42.494569+00
6cc03a4b-4840-47de-a28b-84ac5098b053	Be familiar with the construction and parts of the IVUS catheter	Intermediate	{#IVUS,#Procedure}	\N	2025-09-30 06:17:42.494569+00
7b9e9e0c-1919-4de7-912e-c66a85a2d3ad	Know how to purge the mechanical IVUS catheter	Beginner	{#IVUS,#Procedure}	\N	2025-09-30 06:17:42.494569+00
0f0cce14-3000-4311-b5a4-096d31e5cf81	Know how to set up the mechanical pullback sled	Beginner	{#IVUS,#Procedure}	\N	2025-09-30 06:17:42.494569+00
c51a091f-4305-4bcd-879b-0e2d9ebdc1e2	Understand the effect of distance from transducer on IVUS image quality	Beginner	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
9de71538-cab4-4074-b218-4a54d2c04c75	Understand the effect of transducer frequency on the image	Beginner	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
22f638fe-3f38-4c0c-891a-1139087b3ebb	Know the definition of spatial resolution in the IVUS image	Intermediate	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
e484512e-eadf-421a-a484-e92df3605959	Know the definition of contrast resolution in the IVUS image	Intermediate	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
4617497e-a67c-4274-8f17-e5dbfe3329fd	Understand the type of structures which reflect sound waves and appear bright	Beginner	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
6ba05d5e-1e0c-4472-8ed6-16d42e98b2d0	Understand the type of structures through which sound waves travel well	Beginner	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
f0209f0b-8c6a-4099-bccd-2c89f175f32d	Know the difference between mechanical vs electronic, solid-state IVUS systems	Beginner	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
5205c4a4-3a82-4e26-92a0-c5126e985477	Know the difference in resolution between IVUS and OCT images	Beginner	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
4c199305-2766-4d62-90ad-df010d45016d	Know the important differences between IVUS and OCT	Beginner	{#IVUS,"#Clinical Application",#Physics}	\N	2025-09-30 06:17:42.494569+00
a72780b6-5f11-4ab6-abc7-513078fb1e65	Know the difference in IVUS vs OCT measurements using the same phantom	Beginner	{#IVUS,#Physics,#Measurement}	\N	2025-09-30 06:17:42.494569+00
ac5d6566-593d-4488-ada0-72e6a3f77525	Know the frequency range of different IVUS systems	Intermediate	{#IVUS,#Physics}	\N	2025-09-30 06:17:42.494569+00
3d47e962-b360-4a1d-8922-5996aa90eea7	Understand  and identify non-uniform rotational distortion (NURD) artifacts	Intermediate	{#IVUS,#Physics,#Artifact,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
805fa2b7-3ef4-4bfc-99db-0f603aa988ad	Understand  and identify motion artifacts	Intermediate	{#IVUS,#Physics,#Artifact,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
b72cf7ac-4c74-47f0-920a-55e88eab4008	Understand  and identify ring-down artifacts	Beginner	{#IVUS,#Physics,#Artifact,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
4664ea18-0d33-4469-8a48-bc1a5ae233b9	Understand and identify reverberation artifacts	Intermediate	{#IVUS,#Physics,#Artifact,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
2a6ddc58-4d65-4fe8-a546-48d224701b05	Understand and identify shadowing in an IVUS image	Beginner	{#IVUS,#Physics,#Artifact,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
3ea196a9-68c9-4f59-8aef-00891607d2b7	Understand  and identify the result of air in the system in mechanical IVUS	Beginner	{#IVUS,#Physics,#Artifact,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
caefc5d7-f3f9-4b9e-b667-5d71f7d7e389	Understand the effect of vessel curvature on the IVUS image and measurements	Intermediate	{#IVUS,#Artifact,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
9b1c4508-cd9e-459a-9166-9c04d4ee2f1b	Know the difference in manual vs motorized pullback during IVUS interrogation	Beginner	{#IVUS,#Procedure,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
8fb92519-25fe-4968-bc02-3c4811556a67	Understand how to obtain accurate longitudinal (L) mode images on IVUS	Beginner	{#IVUS,#Procedure,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
1f10c1c0-6190-4d75-a823-8c40e750933a	Understand the range of pullback speeds and effects on image	Beginner	{#IVUS,#Procedure,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
e1949a0a-4929-4ccf-9c1b-157ac0db3d50	Know how to use IVUS catheter markers to estimate length on angiography	Beginner	{#IVUS,#Procedure,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
ce7bddf8-3103-4c7c-af17-b1bb65b5915f	Know how to perform IVUS angiographic co-registration	Intermediate	{#IVUS,#Procedure,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
7449786e-f01d-4477-b583-41cf28441a7b	Understand how to interrogate the aorto-ostial region	Intermediate	{#IVUS,#Procedure}	\N	2025-09-30 06:17:42.494569+00
76f33b2a-5bc6-4897-93f3-f0cfbf2f7756	Understand the role of nitroglycerin during IVUS	Beginner	{#IVUS,#Procedure,#Pharmacology}	\N	2025-09-30 06:17:42.494569+00
2468c0b0-bdb9-4ffe-a55e-6a0eb5139ce9	Know the degree of anticoagulation needed prior to performing IVUS	Beginner	{#IVUS,#Procedure,#Pharmacology}	\N	2025-09-30 06:17:42.494569+00
118e2cac-fddb-466c-ad31-3d223a7a3dcf	Understand the criteria for choosing and definition of proximal reference	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
611dc6de-57ca-429d-be03-da84b4483292	Understand the criteria for choosing and definition of distal reference	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
f1c5b5c4-6a8f-4270-a621-bb2b133a026f	Know how to calculate average reference lumen size	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
80d28eae-e205-463d-8310-65a8690c1d60	Be able to make lumen area measurements	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
411f0222-1db8-4fa6-af15-cb40202a4cce	Know which boundary edge is used for measurement	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
69cfaaed-82ca-4442-b866-f25272dd99bf	Be able to identify all three layers of artery	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
cf6da86e-2391-4f96-8e0b-aff8f990cc6a	Recognize the appearance of blood speckle	Beginner	{#IVUS,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
63a0d47e-3522-4aaa-b0fa-09206cd0ca5e	Be able to make lumen diameter measurements	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
4ac5dd28-f812-48db-bbf9-1d51ad2a0707	Know how to calculate lumen area stenosis	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
a44115a9-1316-477e-88be-0c3a0440ac3d	Be able to make external elastic membrane (EEM) area measurments	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
0bf074d7-caeb-4db1-bf03-bd4a022df416	Know how to calculate plaque burden	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
08c786cb-c087-4fd3-bbae-4bf116d0a74a	Understand that the presence of atheroma burden does not necessarily equate to stenosis	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
a70d7976-0316-45a1-94f0-dbc8ab140058	Know how to express the presence of calcium quantitatively on IVUS	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
3cc51eae-7560-46e7-a325-3a879639b621	Recognize superficial vs deep calcium on IVUS	Beginner	{#IVUS,#Procedure,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
feb5a29b-7957-401e-8900-fdb9356ae70f	Recognize stent struts on IVUS	Beginner	{#IVUS,#Procedure,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
371c937b-bc75-4a27-9bb2-541fc8b3cad7	Recognize tissue protrusion within stent on IVUS	Intermediate	{#IVUS,#Procedure,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
1002246d-f7f9-4539-93d0-1715046948b2	Be able to calculate stent area	Beginner	{#IVUS,#Procedure,#Measurement,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
8c7372a6-d6ac-42ba-8c70-3dae9eaeec51	Be able to calculate % stent expansion post PCI	Beginner	{#IVUS,#Procedure,#Measurement,#PCI}	\N	2025-09-30 06:17:42.494569+00
3db3cc73-677d-4c96-97ba-d1f236a7ac16	Recognize stent malapposition on IVUS	Beginner	{#IVUS,#Procedure,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
43645d6e-e8ec-43b1-8837-d1ab2862eed4	Recognize side branches on IVUS	Beginner	{#IVUS,#Procedure,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
4db67af8-6d51-487b-976e-faa3d465a93f	Be able to describe the Glagov phenomenon	Beginner	{#IVUS,#Pathophysiology}	\N	2025-09-30 06:17:42.494569+00
07280dec-a8d3-43f9-8f48-f109b9b2161e	Know the possible reasons for echolucent areas within a plaque	Beginner	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
d36127b3-f74f-4800-8999-e600bfa97a13	Recognize the appearance of fibrous plaque	Beginner	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
8d3c7808-52db-441b-9b08-69381587e2ab	Recognize the appearance of intracoronary thrombus	Beginner	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
1d5f79d7-a876-42f2-aab7-1a81757d8213	Understand that no feature of thrombus is pathogonomic and that the diagnosis is presumptive	Beginner	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
05addf27-99fa-4296-87c3-202c8e5b256e	Be able to identify intimal hyperpasia within the stent	Beginner	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
8ee25f4c-1736-4610-a346-4bacd36a48ff	Understand that early ISR may be hard to recognize secondary to low echogenicity	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
7ffe261c-5e39-49da-86bd-8b851748897a	Be able to recognize intra-mural hematoma	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
3f0c8cd2-9099-416a-8d27-cfc651ce97fa	Be able to recognize dissection within vessel wall	Beginner	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
840480cc-f4e5-4bd3-8cb6-079f852efda4	Be able to quantify degree of dissection	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
5093f650-675a-424c-89c5-87bf5a0f6d04	Recognize vulnerable plaque characteristics on IVUS	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
4b699343-972b-4461-a5e0-88ce24f9f70b	Be able to recognize calcium nodule	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
5ef5d35a-62e4-4d75-81ee-e1ac8d5d46c3	Be able to recognize ruptured plaque	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
e41ab296-9e7a-4b67-acde-260a38194afb	Be able to recognize true aneurysm	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
277c7599-a6b8-46f3-bcc3-17ad60f50e90	Be able to recognize pseudoaneurym	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
338364be-0b70-487e-96e1-0d04f402e387	Be able to recognize SCAD	Expert	{#IVUS,#Pathophysiology,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
37e40421-427d-4a3d-bac9-baa239fa8311	Know the threshold measurement defining transplant asculopathy	Intermediate	{#IVUS,#Pathophysiology,"#Image Interpretation",#Measurements}	\N	2025-09-30 06:17:42.494569+00
6a09d395-4b9c-482d-93c8-f3e55c4b51cd	Understand how to use Virtual Histology on Volcano solid state IVUS	Expert	{#IVUS,#Pathophysiology,"#Image Interpretation",#Measurements,#Procedure}	\N	2025-09-30 06:17:42.494569+00
d5639e42-8745-469b-be9d-41e03c8988c0	Know the US guidelines Class of Recommendation and Level of Evidence for IVUS use	Intermediate	{#IVUS,"#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
bad2c6a4-c033-4804-bf7c-8f85fb8d24e2	Know the European guidelines Class of Recommendation and Level of Evidence for IVUS use	Intermediate	{#IVUS,"#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
51545a34-77ed-4985-ad7c-42f70b875a5b	Know the different approaches to determining optimal stent sizing	Intermediate	{#IVUS,#Measurements,#PCI,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
3400c824-ae0d-4f1e-9281-20ad88a3b999	Know how to choose post dilatation balloon size using IVUS	Intermediate	{#IVUS,#Measurements,#PCI}	\N	2025-09-30 06:17:42.494569+00
1aa2b997-f0c7-4289-b6c4-3e79d294bea1	Be able to grade the different approaches to stent sizing from least to most aggressive	Intermediate	{#IVUS,#Measurements,#PCI,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
928f499d-1631-4c53-a3e4-6e7b7835eaab	Know the optimal plaque burden threshold at the stent edges associated with better outcomes	Intermediate	{#IVUS,#Measurements,#PCI,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
6a0a751e-35a4-43bf-910c-57f1328941c7	Understand the findings post PCI on IVUS associated with worse outcomes	Intermediate	{#IVUS,#Measurements,#PCI,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
9404269b-bbc2-4599-9348-cacc2c742958	Know the MSA measurement thresholds associated with improved outcomes post PCI	Intermediate	{#IVUS,#Measurements,#PCI,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
da51046e-802b-4195-9bc4-4ab1e738751b	Know the left main MSA thresholds for the different left main bifurcational techniques associated with improved outcomes post PCI	Intermediate	{#IVUS,#Measurements,#PCI,"#Left Main"}	\N	2025-09-30 06:17:42.494569+00
dddbaae4-422a-4f40-b7a2-d131a4b64663	Know the stent expansion thresholds associated with improved outcomes post PCI	Intermediate	{#IVUS,#Measurements,#PCI}	\N	2025-09-30 06:17:42.494569+00
0fbc8a5e-17d5-4701-8ae6-942e20061547	Know the major randomized studies showing benefit in MACE reduction with IVUS	Intermediate	{#IVUS,"#Clinical Trials","#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
585419df-0c81-46a6-bb22-63e653ede109	Know the threshold MLA used to predict hemodynamic significance of a lesion	Intermediate	{#IVUS,#Measurements,"#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
97f192f7-749d-4723-8935-388d3d99574c	Know the threshold MLA used to evaluate the left main with IVUS in intermediate lesions	Intermediate	{#IVUS,#Measurements,"#Clinical Application","#Left Main"}	\N	2025-09-30 06:17:42.494569+00
879922a7-94de-4a56-93de-32c9aecb9da0	Know how to use Artificial Intelligence for automatic vessel evaluation in IVUS	Expert	{#IVUS,#Measurements,"#Image Interpretation","#Artifical Intelligence"}	\N	2025-09-30 06:17:42.494569+00
2fed6dfc-61ac-42d4-90c9-dd9476529a8f	Be familiar with the 2018 EAPCI Expert Consensus algorithm for PCI IVUS optimization	Intermediate	{#IVUS,#Measurements,#PCI}	\N	2025-09-30 06:17:42.494569+00
c23fa4b9-d17c-4e7b-bae4-da6b223b3ba3	Recognize the appearance of bio-absorbable stents on IVUS	Expert	{#IVUS,"#Image Interpretation"}	\N	2025-09-30 06:17:42.494569+00
a021f913-c867-4d9a-84b3-c41ee4bfba36	Know the role of IVUS during use of DCB in de novo lesions	Expert	{#IVUS,#PCI,"#Clinical Application"}	\N	2025-09-30 06:17:42.494569+00
\.


--
-- Data for Name: competencies_stage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competencies_stage (name, difficulty, tags) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, email, full_name, role, created_at, is_admin) FROM stdin;
391ef318-e31b-4731-bf38-fd7ee0e9290b	murad.novruzov1899@gmail.com	\N	trainee	2025-09-29 05:03:08.427487+00	f
\.


--
-- Data for Name: competency_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competency_assignments (student_id, competency_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: competency_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competency_questions (id, competency_id, body, created_at) FROM stdin;
\.


--
-- Data for Name: competency_topics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competency_topics (competency_id, topic_id, created_at) FROM stdin;
\.


--
-- Data for Name: doctor_students; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.doctor_students (doctor_id, student_id, created_at) FROM stdin;
\.


--
-- Data for Name: student_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.student_answers (student_id, question_id, is_correct, answered_at) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-09-10 03:47:15
20211116045059	2025-09-10 03:47:18
20211116050929	2025-09-10 03:47:20
20211116051442	2025-09-10 03:47:22
20211116212300	2025-09-10 03:47:25
20211116213355	2025-09-10 03:47:27
20211116213934	2025-09-10 03:47:29
20211116214523	2025-09-10 03:47:32
20211122062447	2025-09-10 03:47:34
20211124070109	2025-09-10 03:47:36
20211202204204	2025-09-10 03:47:38
20211202204605	2025-09-10 03:47:40
20211210212804	2025-09-10 03:47:47
20211228014915	2025-09-10 03:47:49
20220107221237	2025-09-10 03:47:51
20220228202821	2025-09-10 03:47:53
20220312004840	2025-09-10 03:47:55
20220603231003	2025-09-10 03:47:59
20220603232444	2025-09-10 03:48:01
20220615214548	2025-09-10 03:48:03
20220712093339	2025-09-10 03:48:05
20220908172859	2025-09-10 03:48:08
20220916233421	2025-09-10 03:48:10
20230119133233	2025-09-10 03:48:12
20230128025114	2025-09-10 03:48:15
20230128025212	2025-09-10 03:48:17
20230227211149	2025-09-10 03:48:19
20230228184745	2025-09-10 03:48:21
20230308225145	2025-09-10 03:48:23
20230328144023	2025-09-10 03:48:25
20231018144023	2025-09-10 03:48:28
20231204144023	2025-09-10 03:48:31
20231204144024	2025-09-10 03:48:33
20231204144025	2025-09-10 03:48:35
20240108234812	2025-09-10 03:48:37
20240109165339	2025-09-10 03:48:39
20240227174441	2025-09-10 03:48:43
20240311171622	2025-09-10 03:48:46
20240321100241	2025-09-10 03:48:51
20240401105812	2025-09-10 03:48:56
20240418121054	2025-09-10 03:48:59
20240523004032	2025-09-10 03:49:07
20240618124746	2025-09-10 03:49:09
20240801235015	2025-09-10 03:49:11
20240805133720	2025-09-10 03:49:13
20240827160934	2025-09-10 03:49:15
20240919163303	2025-09-10 03:49:18
20240919163305	2025-09-10 03:49:20
20241019105805	2025-09-10 03:49:22
20241030150047	2025-09-10 03:49:30
20241108114728	2025-09-10 03:49:33
20241121104152	2025-09-10 03:49:35
20241130184212	2025-09-10 03:49:38
20241220035512	2025-09-10 03:49:40
20241220123912	2025-09-10 03:49:42
20241224161212	2025-09-10 03:49:44
20250107150512	2025-09-10 03:49:46
20250110162412	2025-09-10 03:49:48
20250123174212	2025-09-10 03:49:50
20250128220012	2025-09-10 03:49:52
20250506224012	2025-09-10 03:49:54
20250523164012	2025-09-10 03:49:56
20250714121412	2025-09-10 03:49:58
20250905041441	2025-09-25 01:53:20
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (id, type, format, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-09-10 03:47:11.54388
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-09-10 03:47:11.564599
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-09-10 03:47:11.572315
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-09-10 03:47:11.612429
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-09-10 03:47:11.691842
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-09-10 03:47:11.700245
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-09-10 03:47:11.707111
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-09-10 03:47:11.713745
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-09-10 03:47:11.7192
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-09-10 03:47:11.723702
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-09-10 03:47:11.737875
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-09-10 03:47:11.744069
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-09-10 03:47:11.752941
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-09-10 03:47:11.775748
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-09-10 03:47:11.779848
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-09-10 03:47:11.813489
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-09-10 03:47:11.821853
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-09-10 03:47:11.825706
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-09-10 03:47:11.830907
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-09-10 03:47:11.838752
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-09-10 03:47:11.844428
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-09-10 03:47:11.851745
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-09-10 03:47:11.868164
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-09-10 03:47:11.893009
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-09-10 03:47:11.897801
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-09-10 03:47:11.904312
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-09-10 04:00:33.892682
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-09-10 04:00:34.039436
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-09-10 04:00:34.050642
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-09-10 04:00:34.067109
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-09-10 04:00:34.076733
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-09-10 04:00:34.083211
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-09-10 04:00:34.090937
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-09-10 04:00:34.098256
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-09-10 04:00:34.099857
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-09-10 04:00:34.105482
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-09-10 04:00:34.109647
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-09-10 04:00:34.126194
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-09-10 04:00:34.132103
39	add-search-v2-sort-support	39cf7d1e6bf515f4b02e41237aba845a7b492853	2025-09-29 04:58:06.683595
40	fix-prefix-race-conditions-optimized	fd02297e1c67df25a9fc110bf8c8a9af7fb06d1f	2025-09-29 04:58:06.715059
41	add-object-level-update-trigger	44c22478bf01744b2129efc480cd2edc9a7d60e9	2025-09-29 04:58:06.734859
42	rollback-prefix-triggers	f2ab4f526ab7f979541082992593938c05ee4b47	2025-09-29 04:58:06.739813
43	fix-object-level	ab837ad8f1c7d00cc0b7310e989a23388ff29fc6	2025-09-29 04:58:06.747127
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 9, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict trKLNtSPe0JYec5P2IR1NCYWUbne5U1VV3Pbzuw2TwsWSQnVT5HhfJqSyp8oGeg

