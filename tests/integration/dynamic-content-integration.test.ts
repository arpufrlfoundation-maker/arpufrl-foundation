import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/glo;

imp / route';
import { GET as donorHighlightsGET } from '@/app/api/donors/highlights/route';
imrom 'fs';
import { connectToDatabase } from '@/lib/db';
import { Donation } from '@/models/Donation';
im

//esting
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    MONGODB_URI: 'mongodb://localho
  ',
    NEXTAUTH_URL: 'http://localhost:3000',
    RAZORPAY_KEY_ID: 'test-key-id',
    RAZORPAY_KEY_SECRET: 'test-key-secret',
    RAZORPAY_WEBHOOK_SECRET: 'test-webhook-secret',
    APP_URL: 'http://localhost:3000',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

//ncies
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

db');
jest.mock('@/models/Donation');
jest.mock('@/lib/privacy-audit');

const mockFs = fs as jest.Mocked<
const mockConnectToDatabase = connectToDatase >;
const mockDonation = Donation as jest.Mocked<tnation>;
const mockPrivacyAuditor = PrivacyAuditor as jest

describe('Dynamic Content Mana {
  beforeEach(() => {
  jest.clearAllMocks();
});

descr() => {
  {
    // Test valid content serving
    const validContent = {
      organization: {
        name: 'Test Organization',
        email: 'test@example.com',
      },
      navigation: [{ id: 1, label/ ' }],
        hero_section: {
        title: 'Test Title',
        subtitle: 'Test Subtitle',

      },
        highlight_cards: [],
        mission_section: { heading: 'Missit' },
        call_to_action: {
          heading: 'CTA',
        achievements_section: {
          headin
        about_section: { heading:  },
          blog_section: {
            heading: ' },
        team_section: { heading:]
    },
      footer: {
        quick_links: [],
       om' },
Test',
  },
};

mockFs.readFile.mockResolvtent));

const request = new Nexnt');
const response = await contenquest);
const data = await response.json;

expect(response.status).toBe(2
      expect(data.organization.name).toBe('Test Organization');
e;
    });

it('should handle content validation erro => {
      // Test invalid content structure
      const invalidContent = { invalid: 'structure' };
mockFs.readFile.mockResolvedValueOnce(JSON.stringi

      const request = new NextRequest('http://localhost:ntent');
const response = await contentRouteGET(request);
const data = await response.json();

      e00);
;
expect(response.headers.get('X-Error')).toBe('validation-error');
expect(data.organization.name).toBe('ARPU );
    });

it('should handle file read errors gracefully', c() => {
  mockFs.readFile.mockRejectedValueOound'));

      const request = new Next;
  cest);


expect(response.status).toBe(200);
expect(response.headers.get('X-Content-Source')).toBe('falk');
expect(response.headers.get('X-Error')).);
expect(data.organization.name).toBe('ARPU Fu');
    });

it('should optimize conten> {
      c {
},
  navigation: [],
  hero_section: {
  title: 'Test',
  subtitle: 'Test',
  buttons: [],
  image: '/hero-image.jpg',
},
  highlight_cards: [
  ' },

        mission_section: {
    heading: 'Mission',
    text: 'This is a very long misons.',
  },
  call_to_action: {
    heading: 'CTA', textt' },
        achievements_section: {
    heading: 'Achi},
        about_section: {
      heading: 'About',
      ions.',

        blog_section: { heading: 'Blog', posts: [] },
  team_section: {
    heading: 'Tea] },
        footer: {
      quick_links: [],
      contact: { email: 'test@example.com' },
      copyright: '© 2025 Test',
    },
  };



const mobileRequest = new NextRequest');
const response = await contentRouteGET;
const data = await response.json();

expect(response.status).toBe(20);
expect(response.headers.get('X-Mobile-Optimirue');
expect(data.hero_section);
e
     );
...');
    });
  });

describe('Donor Highlights Integration with Priva
    beforeEach(() => {
  mockConnectToDatabase.mockResolvedVal;
  mockPrivacyAuditor.logDo;
  m
});

it('should integrate donor highligh() => {
      const mockDonors = [
  {
    id: 'donor1@example.com',
    displayName: 'John Doe',
    5000,
    false,
    displayFormat: 'name_amount',
    donationDate: new Date('2024-15'),
  },
  {
    id: 'donor2@example.com',
    displayName: 'Anonym
       0,
    e,
    nonymous',
          donationDate: new Date('2024-01-10'),
  },
];

mockDonation.getPublicDo
mockDonation.countDocumealue(10);

c
st);
const data = await response.json();

expect(response.status).toBe0);
expect(data.success).toBe(t
      expect(data.data.privacyCompli
      expect(data.data.donors)

     it logging

        2, // donor count
  8, // filtered count
  expect.any(String),
  expect.any(String)
);
    });

it('should handle privacy violati{
      mockConnectToDataba;

const request = new ghts');
const response = await donquest);
const data = await response.js

expect(response.status).toBe(0);
expect(data.success).to;
expe

// Verify privacy violatio
expect(mockPrivacyAuditor.l(
  'donor_highlights_error',
  {
    error: 'Database connect},
        expect.any(String)
      );
    });

it('should respect limit paramete
      mockDonation.getPublicDoalue([]);
mockDonation.countDocuments = 5);

con
      awt);

expect(mockDonation.getPublicDonat(10);
expect(mockPrivacyAuditor.logDonorHighlightsAcceith(
  0, // no public donations
  5, // total filtered
  exp,
  e
);
 });
  });

describe('End-to-End Content and Donor Highlights => {
    it('should handle complete dynamic content workflow', {
  // Step 1: Load content successfully
  const validContent = {
    organization: { name: 'Test Org', email: 'test@exampom' },
    navigation: [{ id: 1, label: 'Home', link: '/' }],
        : [] },
  [],
  mission_section: { heading: 'Mission', text: 'Mission text' },
  call_to_action: { heading: 'CTA', text: 'CTA text' },
  a
},
  t' },

  ,

  [],
  contact: {
    email
  5 Test',
        },
      };

mockFs.readFile.mockResolvedValue(JSON.stringify(validContent));

t');
const contentResponse = await
      const contentData = await contentResponse.json();

expect(contentResponse.status).toBe(200);
expect(contentData.organization.name).toBe('Test Org');

// Step 2: Load donor hiompliance
const mockDonors = [
  {
    id: 'donor1@exampm',
    displayName: 'John Do
          amount: 5000,
    alse,
    displayFormat: 'name_amount',
  ,
        },
      ];


  });
});  }); mit
  fault li / DeWith(50); /enCalledBeoHaveDonations).tPubliconation.getkDect(moc      expble bounds
to reasonalimit Should
      // (request);
GETHighlightst donor
      awai0);
e(dValulven().mockReso jest.f = cuments.countDoionDonat   mock
   ; alue([])ckResolvedVmo).s = jest.fn(nationDotPublicn.ge mockDonatio
);
 =999999'its?limhlightdonors/hig:3000/api/calhost://lost('httpextRequest = new N requenst    coput
  s inioully malicntia pote / Test with      /=> {
) ts', async (l inpu alvalidatend  sanitize a it('should;

    })   );
nt
   ser ageg)  // Uny(Strin   expect.a
     ng), // IPt.any(Stri    expec  d count
/ filtere  0, /unt
      or co 0, // don
  With(eBeenCalledavcess).toHhlightsAcrHiglogDonovacyAuditor.Prit(mockxpec    est);

tsGET(requeorHighlighdon await ;


      }) },       ,
  st Browser'gent': 'Te 'User - A
    , 92.168.1.1'-For': '1rdedwaX-For        '
headers: {
    , {ts'ighhlig/honors:3000/api/dlocalhosttp://htquest('xtRenew Nest = reque const

    alue(0);vedVockResol).mst.fn(je = s ocumenttDcounockDonation.m;
    alue([])ckResolvedV).mos = jest.fn(licDonation.getPubtionockDona
      mentg is consistitin audthat privacyt // Tes=> {
      () ts', async all endpoins liance acros comprce privacyld enfo it('shou {
      ', () =>ontegrati Privacy Iny and'Securitcribe();

      des
    });
  }); lled(aveBeenCaoHtion).tPrivacyViolauditor.logmockPrivacyApect(d
      exbe loggeld shoution  violacyiva    // Pr

  Be(false);).toantivacyComplipect(data.pr    exs');
  ghtonor highli ded to fetchBe('Faila.error).to  expect(datse);
    e(faluccess).toBt(data.s expec
00); toBe(5s).tatue.snsespopect(r      exash
but not crurn error uld ret   // Shoon();

    .jssponsea = await renst dat      co
    (request); tsGETorHighlighdonse = await st respon     conhts');
  rs / highlig / donoapi00 / localhost: 30'http://tRequest(new Nexest = equst r    con);

  ailable')se unavtabaew Error('DadValue(necteReje.mockoDatabasockConnectT  m    ils
 fationconnec Database  {
      // () =>, asyncssues'database iuring bility dvice availaserintain should ma  it('   });


 );vered Org'Recome).toBe('ion.nata.organizatndDact(seco    expele');
  ).toBe('fint-Source')get('X-Conteers..headondResponsesecxpect(
      e200);tatus).toBe(sponse.sondRect(secexpe;

      .json()Responsesecondt = awaita ndDasecot   consest);
  condRequuteGET(setRowait contenesponse = acondRonst se c
  );ntent'000/api/cot:3//localhosp:uest('htttReqNexnew st = ueecondReqt sons  c

    tent)); ify(validConngN.strince(JSOvedValueOle.mockResolockFs.readFi  m     };

  },

  st', Teht: '© 2025     copyrig
     }, ample.com' : 'test @ex{ email  contact: [],
  uick_links: q
  footer: {
    bers: []
  },am', meming: 'Teion: { headteam_sect[] },
  posts:: 'Blog', n: { headinglog_sectio     b
   ut text' },xt: 'About', teading: 'Abo: { hection_se       about] },
    rds: [ts text', ca'Achievemenext: ements', t'Achievading: on: {
      hements_secti    achievet' },
    'CTA texTA', text: 'C { heading:tion:o_ac   call_t'
    },
      on textMissi, text: ''Mission'heading: on: { _sectission      mi  [],
t_cards: highligh
    ]
  }, s: [onTest', butttitle: 'ubTest', s title: 'o_section: {
    er      h,
    []ation: navig    m' },
mple.col: 'test@exag', emaired Ore: 'Recoveam { nion:organizat     {
      = ent validCont
      consteeds succestqu Second re
      //k');
oBe('fallbacrce')).tnt - Sou'X-Conteaders.get(e.heponsestRct(firs
      expee(200); tus).toBta.stResponseirsct(f
      expe);
    questtReET(firstentRouteGwait connse = aespoconst firstR
      ');content00/api/30lhost:tp://locauest('htextReq = new Nt esfirstRequonst ;

      c'))ry failureporar('Temw Erro(neueOnceectedValFile.mockRej mockFs.read
      failst requestirs     // F () => {
 ures', asyncrary failmpoer from teould recov    it('sh {
() => e', d Resilienc an RecoveryErrorbe('

  descri  }); });
  lidate');
must - revaore, -stache, nono - ce(').toBhe-Control')'Cacrs.get(ponse.heade expect(resd');
     triggereation ent revalidoBe('Contessage).tdata.mexpect(
 e(200);status).toBt(response.
  expec
); json(se.ait responaw data = constT();
     t POS = await responseons c');
t / route / api / conten@/appire('requST } = st { POon    cation
  or revalid endpoint ft POST    // Tes) => {
    (ion', asyncrevalidattent onndle c ha it('should      });

e = 600');
xagntain('s-ma.toCo))rol'nt'Cache-Cors.get(.headeResponse(mobilexpectt);
      ebileRequesuteGET(montRonteit co awaonse = ileRespst mob     con);
 e'mobile=truent?api/cont3000///localhost:uest('http: new NextRequest = st mobileReq
      conache) (longer cing mobile cachest    // T);

xage = 300'ontain('s - marol')).toCCache-Contt('aders.geResponse.heect(desktop
      expest); opRequuteGET(desktntRoconteit = awasponsedesktopRe    const   t');
conten0 / api /00 / localhost: 3t('http:/w NextReques neRequest =opnst desktng
      cocachist desktop Te
      // nt));
Contengify(validN.strie(JSOedValuolvile.mockRess.readF  mockF

  ,
      };
        }25 Test', 20t: '©  copyrigh
        om' },ple.c@exam 'testt: {
  email:taccon       s: [],
    quick_link        er: {
      foot
 ]
    }, members: [ing: 'Team', { headction: m_se    tea },
      osts: [] g: 'Blog', pdin { heation: sec       blog_ },
      xt't tetext: 'Aboubout', ng: 'An: { headictiout_sebo  a     ds: [] },
      t', carnts texchievemet: 'Atex', vements 'Achieading: {
        hes_section: achievement
         text' },: 'CTAtextTA',  heading: 'Cn: {
        tio call_to_ac    ext' },
   ion tss: 'Mi textsion', 'Mising: { headection:n_s  missio    [],
  _cards: ight       highl]
},
  ons: [utte: 'Test', b subtitlTest',title: 'section: {
    hero_n: [],
    avigatio    n
  }, m't@example.cotes email: 'rg',Test Oname: 'zation: {
    organi     ntent = {
      nst validCo      conc() => {
      nt', asy for conterse headeiate cacht approprset('should     i() => {
      on', ti Integrangchiance and Cabe('Performescri
  d
);
    }); }   e);
    alse(ftoBpliant).privacyComorData.expect(don    ;
    oundation')e Life Fe RisPU FuturoBe('AR).tzation.nameganiata.orentDct(cont   expe  racefully
 ailures gndle fh should ha   // Bot);

   alseBe(fess).tota.succDaorpect(don     exe(500);
 .status).toBnorResponset(do expecon();

 ponse.jst donorResawaiData = onst donor    cequest);
    T(donorRhtsGEligrHigh donowaitesponse = aonorR   const ds');
   s / highlighti / donor00 / apst: 30tp://localho'htst(ueeq = new NextRestdonorRequ   const

 error'));ase r('Datablue(new ErrockRejectedVaDatabase.moockConnectTo      mils
PI also faighlights Ar h   // Dono');

   allback.toBe('fnt-Source'))t('X-Conteeaders.gentResponse.hxpect(conte
      e.toBe(200);us) esponse.statntentR(copect   ex   on();

    sponse.jsontentRe cawaitata = st contentD;
      conntRequest) ET(contententRouteGt coonse = awaiResponst content);
    ci / content'3000/apt:ostp://localhuest('htextReqt = new NntRequesst conte    con);

   error')ent filent'Co(new Error(tedValueejecle.mockRFickFs.read  mollback
    erves fas but s failAPIContent /      /{
 => ync() ', aslyulcefes grag failure cascadindl han  it('should);

  );
    }toBeDefined(ta.donors).Data.da(donorpect      ex;
    d().toBeDefinename) ion.ta.organizatentDant expect(coer
     rk togethAPIs woboth  Verify tep 3:   // S);

      Be(trueliant).tocyCompdata.privaata.ct(donorD   expe
        (true);).toBesuccessData.(donorpect    exBe(200);
  atus).tose.stnorResponxpect(do;

      eonse.json() donorResp = awaitataonorD     const dequest);
    (donorRhlightsGETnorHigwait do = arResponsenst dono  co');
    highlightsapi / donors / 0 / lhost: 300ocap://lt('httextReques Nquest = newRest donor
    conValue(5);
    ckResolvedfn().mo = jest.ntsocumeation.countD     mockDonDonors);
    mocklvedValue(eso().mockRst.fntions = jeDona.getPublication   mockDon