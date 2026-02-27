import { prisma } from "../config/prisma";
import { IdentifyRequest } from "../types/identify.types";
import { Prisma } from "@prisma/client";

export const identifyContact = async (data: IdentifyRequest) => {
  const { email, phoneNumber } = data;

  if (!email && !phoneNumber) {
    throw new Error("At least one of email or phoneNumber is required");
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Find all matching contacts by email or phone
    const matched = await tx.contact.findMany({
      where: {
        OR: [
          { email: email || undefined },
          { phoneNumber: phoneNumber || undefined },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // If no match → create new primary
    if (matched.length === 0) {
      const newContact = await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkPrecedence: "primary",
        },
      });

      return buildResponse(tx, newContact.id);
    }

    // Collect all primary IDs involved
    const primaryIds = new Set<number>();

    for (const contact of matched) {
      if (contact.linkPrecedence === "primary") {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    // Fetch all primaries sorted by oldest
    const primaries = await tx.contact.findMany({
      where: { id: { in: Array.from(primaryIds) } },
      orderBy: { createdAt: "asc" },
    });

    const oldestPrimary = primaries[0];

    // Convert other primaries into secondary
    for (const primary of primaries) {
      if (primary.id !== oldestPrimary.id) {
        await tx.contact.update({
          where: { id: primary.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: oldestPrimary.id,
          },
        });

        await tx.contact.updateMany({
          where: { linkedId: primary.id },
          data: { linkedId: oldestPrimary.id },
        });
      }
    }

    // Fetch full group under oldest primary
    const fullGroup = await tx.contact.findMany({
      where: {
        OR: [{ id: oldestPrimary.id }, { linkedId: oldestPrimary.id }],
      },
    });

    const emailExists = email
      ? fullGroup.some((c) => c.email === email)
      : true;

    const phoneExists = phoneNumber
      ? fullGroup.some((c) => c.phoneNumber === phoneNumber)
      : true;

    // ONLY create secondary if either email OR phone is new
    if (!(emailExists && phoneExists)) {
      await tx.contact.create({
        data: {
          email,
          phoneNumber,
          linkedId: oldestPrimary.id,
          linkPrecedence: "secondary",
        },
      });
    }

    return buildResponse(tx, oldestPrimary.id);
  });
};

const buildResponse = async (
  tx: Prisma.TransactionClient,
  primaryId: number
) => {
  const contacts = await tx.contact.findMany({
    where: {
      OR: [{ id: primaryId }, { linkedId: primaryId }],
    },
    orderBy: { createdAt: "asc" },
  });

  const emails = Array.from(
    new Set(contacts.map((c) => c.email).filter(Boolean))
  ) as string[];

  const phoneNumbers = Array.from(
    new Set(contacts.map((c) => c.phoneNumber).filter(Boolean))
  ) as string[];

  const secondaryIds = contacts
    .filter((c) => c.linkPrecedence === "secondary")
    .map((c) => c.id);

  return {
    contact: {
      primaryContactId: primaryId,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryIds,
    },
  };
};