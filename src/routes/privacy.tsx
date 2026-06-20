import { createFileRoute } from "@tanstack/react-router";
import { ScrollReveal } from "@/components/belpost/ScrollReveal";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useApp } from "@/context/AppProvider";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — БЕЛПОЧТА" },
      { name: "description", content: "Политика обработки персональных данных РУП «Белпочта»." },
    ],
  }),
});

function PrivacyPage() {
  const { tr } = useApp();

  return (
    <SiteLayout>
      <div className="page-container page-container--narrow py-12">
        <ScrollReveal>
          <h1 className="section-title mb-6">{tr("common", "privacy")}</h1>
          <div className="prose prose-slate max-w-none space-y-4 text-sm leading-relaxed text-slate-600">
            <p>
              РУП «Белпочта» обрабатывает персональные данные пользователей сайта в соответствии с законодательством
              Республики Беларусь о защите персональных данных.
            </p>
            <p>
              При оформлении заказов, регистрации личного кабинета и отправке обращений мы собираем имя, контактный телефон,
              адрес электронной почты и данные, необходимые для оказания почтовых услуг.
            </p>
            <p>
              Данные используются исключительно для предоставления услуг, обработки заказов, обратной связи и улучшения
              качества сервиса. Передача третьим лицам осуществляется только в случаях, предусмотренных законом.
            </p>
            <p>
              Вы вправе запросить уточнение, обновление или удаление своих данных, обратившись в контакт-центр по номеру 154
              или через форму обратной связи на сайте.
            </p>
            <p>Используя сайт belpost.by, вы соглашаетесь с условиями настоящей политики.</p>
          </div>
        </ScrollReveal>
      </div>
    </SiteLayout>
  );
}
